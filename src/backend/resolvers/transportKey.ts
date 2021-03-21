import { Crypto } from '@open-rights-exchange/chainjs'
import { toAsymEncryptedDataString } from '@open-rights-exchange/chainjs/dist/crypto/asymmetric'
import { deleteMongo, findOneMongo, upsertMongo } from '../services/mongo/resolvers'
import { Mongo, TransportKeyData } from '../services/mongo/models'
import { AsymmetricEncryptedString, Context, TransportKey } from '../../models'
import { decryptWithBasePrivateKey } from './crypto'

/**
 * Save transportKey until it expires - when it expires, it will be automatically deleted from the table
 */
export async function saveTransportKey(transportKey: TransportKey, context: Context) {
  const basePublicKey = context.constants.BASE_PUBLIC_KEY
  // encrypt private key using service's base public key
  const privateKeyEncrypted = Crypto.Asymmetric.encryptWithPublicKey(basePublicKey, transportKey.privateKey)
  transportKey.privateKeyEncrypted = toAsymEncryptedDataString(JSON.stringify(privateKeyEncrypted))
  // create a new TransportKey record
  await upsertMongo<TransportKeyData>({
    context,
    mongoObject: Mongo.TransportKey,
    newItem: transportKey,
    skipUpdatedFields: true,
  })
}

/** Retrieve TransportKey from the database (by publicKey) */
export async function findTransportKeyAndDecryptPrivateKey(publicKey: string, context: Context): Promise<TransportKey> {
  // check if token is already saved - if, we cant use it again
  const existingAuthToken = await findOneMongo<TransportKeyData>({
    context,
    mongoObject: Mongo.TransportKey,
    filter: { publicKey },
  })
  if (!existingAuthToken) return null
  // decrypt private key using base key
  const privateKey = await decryptWithBasePrivateKey(
    { encrypted: existingAuthToken.privateKeyEncrypted as AsymmetricEncryptedString },
    context,
  )
  const transportKey: TransportKey = {
    publicKey: existingAuthToken.publicKey,
    privateKeyEncrypted: toAsymEncryptedDataString(existingAuthToken.privateKeyEncrypted),
    privateKey,
  }

  return transportKey
}

/**
 * Delete transportKey (after it was used once)
 */
export async function deleteTransportKey(publicKey: string, context: Context) {
  if (!publicKey) return
  // delete TransportKey record
  await deleteMongo<TransportKeyData>({
    context,
    mongoObject: Mongo.TransportKey,
    filter: { publicKey },
  })
}
