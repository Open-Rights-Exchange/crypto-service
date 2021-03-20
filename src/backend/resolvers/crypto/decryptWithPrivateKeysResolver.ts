import { AsymmetricEncryptedString, Context, DecryptWithPrivateKeysParams, ErrorType } from '../../../models'
import { ServiceError } from '../../../helpers/errors'
import { getChain } from '../../chains/chainConnection'
import { assertValidChainType, isNullOrEmpty } from '../../../helpers'
import {
  decryptPrivateKeys,
  decryptAsymmetrically,
  ensureEncryptedAsymIsArrayObject,
  optionallyEncryptReturnValue,
} from './cryptoHelpers'

/**
 *  Decrypts a symmetrically encrypted payload using a password
 *  If returnAsymmetricOptions is specified, the decrypted item is encrypted with this public key before being returned
 *  Returns: the decrypted string OR an asymmetrically re-encrypted payload (using returnAsymmetricOptions)
 */
export async function decryptWithPrivateKeysResolver(
  params: DecryptWithPrivateKeysParams,
  context: Context,
): Promise<{
  decryptedResult?: string
  asymmetricEncryptedString?: AsymmetricEncryptedString
}> {
  assertValidChainType(params?.chainType)
  const {
    chainType,
    encrypted,
    asymmetricEncryptedPrivateKeys,
    symmetricEncryptedPrivateKeys,
    symmetricOptionsForEncryptedPrivateKeys,
    password,
    returnAsymmetricOptions,
  } = params
  const chainConnect = await getChain(chainType, context)
  const { logger } = context

  // might also need to check for symmetric options
  if (!isNullOrEmpty(symmetricEncryptedPrivateKeys) && isNullOrEmpty(password)) {
    const msg = `Password is required to decrypt private key.`
    throw new ServiceError(msg, ErrorType.BadParam, 'decryptWithPrivateKeysResolver')
  }

  // This is error might not be accurate
  if (!asymmetricEncryptedPrivateKeys && !symmetricEncryptedPrivateKeys) {
    const msg = `You should provide asymmetricEncryptedPrivateKeys OR symmetricEncryptedPrivateKeys - Neither were provided.`
    throw new ServiceError(msg, ErrorType.BadParam, 'decryptWithPrivateKeysResolver')
  }

  // extract encrypted keys
  const privateKeys = await decryptPrivateKeys({
    symmetricEncryptedPrivateKeys,
    asymmetricEncryptedPrivateKeys,
    symmetricOptions: symmetricOptionsForEncryptedPrivateKeys,
    password,
    chainConnect,
  })

  // Decrypt asymmetrically with private keys
  const unencrypted = await decryptAsymmetrically(chainConnect, {
    encrypted,
    privateKeys,
  })

  // Optionally re-encrypt result asymmetrically before returning
  return optionallyEncryptReturnValue({ chainConnect, unencrypted, returnAsymmetricOptions })
}
