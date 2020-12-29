import { isNullOrEmpty } from 'aikon-js'
import {
  AsymmetricEncryptedString,
  Context,
  ErrorType,
  RecoverAndReencryptResolverParams,
  SymmetricEncryptedString,
} from '../../models'
import { ServiceError } from '../errors'
import { getChain } from '../../chains/chainConnection'
import { assertValidChainType } from '../../helpers'
import {
  decryptPrivateKeys,
  decryptAsymmetrically,
  encryptAsymmetrically,
  encryptSymmetrically,
  ensureEncryptedAsymIsArrayObject,
  mapAsymmetricOptionsParam,
  mapSymmetricOptionsParam,
} from './cryptoHelpers'

/**
 *  Decrypts a symmetrically encrypted payload using a password (in the authToken)
 *  If returnAsymmetricOptions is specified, the decrypted item is encrypted with this public key before being returned
 *  Returns: the decrypted string OR an asymmetrically re-encrypted payload (using returnAsymmetricOptions)
 */
export async function recoverAndReencryptResolver(
  params: RecoverAndReencryptResolverParams,
  context: Context,
): Promise<{
  asymmetricEncryptedString?: AsymmetricEncryptedString
  symmetricEncryptedString?: SymmetricEncryptedString
}> {
  assertValidChainType(params?.chainType)
  const {
    chainType,
    encrypted,
    asymmetricEncryptedPrivateKeys,
    password,
    asymmetricOptionsForReencrypt,
    symmetricOptionsForReencrypt,
  } = params
  const chainConnect = await getChain(chainType, context)
  const { logger } = context

  // TODO: decryptPrivateKeys needs to support no-chain (decrypt using base key)

  // extract encrypted asym keys (that are encrytped with service's base key)
  const privateKeys = await decryptPrivateKeys({
    asymmetricEncryptedPrivateKeys,
    chainConnect,
  })
  // Decrypt asymmetrically with private keys
  const decrypted = await decryptAsymmetrically(chainConnect, {
    encrypted,
    privateKeys,
  })

  // Reencrypt for return

  console.log('before Encrypt asym')
  // Encrypt asym
  let asymmetricEncryptedString: AsymmetricEncryptedString
  if (!isNullOrEmpty(asymmetricOptionsForReencrypt)) {
    const options = mapAsymmetricOptionsParam(asymmetricOptionsForReencrypt)
    asymmetricEncryptedString = await encryptAsymmetrically(chainConnect, {
      unencrypted: decrypted,
      publicKeys: asymmetricOptionsForReencrypt?.publicKeys,
      ...options,
    })
  }
  console.log('before Encrypt sym')
  // Encrypt sym
  let symmetricEncryptedString: SymmetricEncryptedString
  if (!isNullOrEmpty(symmetricOptionsForReencrypt)) {
    const { symmetricEccOptions, symmetricEd25519Options, isEcc } = await mapSymmetricOptionsParam(
      symmetricOptionsForReencrypt,
      context,
    )
    const options = isEcc ? symmetricEccOptions : symmetricEd25519Options
    symmetricEncryptedString = await encryptSymmetrically(chainConnect, {
      unencrypted: decrypted,
      password,
      options,
    })
  }

  return { symmetricEncryptedString, asymmetricEncryptedString }
}
