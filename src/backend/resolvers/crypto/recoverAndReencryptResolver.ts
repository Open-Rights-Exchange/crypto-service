import {
  AsymmetricEncryptedString,
  ChainType,
  Context,
  EncryptParams,
  ErrorType,
  RecoverAndReencryptResolverParams,
  SymmetricEncryptedString,
} from '../../../models'
import { getChainTypeFromChainConnect, isNullOrEmpty, ServiceError } from '../../../helpers'
import { getChain } from '../../chains/chainConnection'
import {
  decryptAsymmetrically,
  decryptPrivateKeys,
  encryptSymmetrically,
  mapSymmetricOptionsParam,
} from './cryptoHelpers'
import { encryptResolver } from './encryptResolver'

/**
 *  Decrypts an asymmetrically or symmetrically encrypted payload using a password
 *  if symmetricOptions is provided, then encrypted param is expected to be sym encrypted
 *  If returnAsymmetricOptions is specified, the decrypted item is encrypted with this public key before being returned
 *  Returns: the decrypted string OR an asymmetrically re-encrypted payload (using returnAsymmetricOptions)
 */
export async function recoverAndReencryptResolver(
  params: RecoverAndReencryptResolverParams,
  context: Context,
): Promise<{
  asymmetricEncryptedStrings?: AsymmetricEncryptedString[]
  symmetricEncryptedString?: SymmetricEncryptedString
}> {
  const {
    chainType,
    encrypted,
    asymmetricEncryptedPrivateKeys,
    asymmetricOptionsForReencrypt,
    symmetricOptionsForReencrypt,
  } = params
  const chainConnect = await getChain(chainType, context)
  const chainConnectNoChain = await getChain(ChainType.NoChain, context)
  const { logger } = context
  let asymmetricEncryptedStrings: AsymmetricEncryptedString[]

  if (!isNullOrEmpty(symmetricOptionsForReencrypt) && isNullOrEmpty(symmetricOptionsForReencrypt?.password)) {
    const msg = `Password is required to re-encrypt.`
    throw new ServiceError(msg, ErrorType.BadParam, 'recoverAndReencryptResolver')
  }
  // extract encrypted asym keys (that are encrypted with service's base key)
  const privateKeys = await decryptPrivateKeys({
    asymmetricEncryptedPrivateKeys,
    chainConnect: chainConnectNoChain, // use NoChain so it wont expect public keys formatted for a specific chain - base public key is uncompressed
  })

  // Decrypt asymmetrically with private keys
  const decrypted = await decryptAsymmetrically(chainConnect, {
    encrypted,
    privateKeys,
  })

  // Reencrypt for return

  // Encrypt asym
  if (!isNullOrEmpty(asymmetricOptionsForReencrypt)) {
    const encryptParams: EncryptParams = {
      chainType: getChainTypeFromChainConnect(chainConnect),
      asymmetricOptions: asymmetricOptionsForReencrypt,
      toEncrypt: decrypted,
    }
    ;({ asymmetricEncryptedStrings } = await encryptResolver(encryptParams, context))
  }

  // Encrypt sym
  let symmetricEncryptedString: SymmetricEncryptedString
  if (!isNullOrEmpty(symmetricOptionsForReencrypt)) {
    const symOptions = await mapSymmetricOptionsParam(symmetricOptionsForReencrypt, context)
    symmetricEncryptedString = await encryptSymmetrically(chainConnect, {
      unencrypted: decrypted,
      options: symOptions,
    })
  }

  return { symmetricEncryptedString, asymmetricEncryptedStrings }
}
