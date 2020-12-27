import { AsymmetricEncryptedString, Context, DecryptWithPrivateKeysParams, ErrorType } from '../../models'
import { ServiceError } from '../errors'
import { getChain } from '../../chains/chainConnection'
import { assertValidChainType } from '../../helpers'
import {
  decryptPrivateKeys,
  decryptAsymmetrically,
  ensureEncryptedAsymIsArrayObject,
  optionallyEncryptReturnValue,
} from './cryptoHelpers'

/**
 *  Decrypts a symmetrically encrypted payload using a password (in the authToken)
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

  try {
    if (!asymmetricEncryptedPrivateKeys && !symmetricEncryptedPrivateKeys) {
      const msg = `You can only provide asymmetricEncryptedPrivateKeys OR symmetricEncryptedPrivateKeys - both were provided.`
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

    // wrap encrypted value in an array if not already
    const encryptedArray = ensureEncryptedAsymIsArrayObject(chainConnect, encrypted) || []

    // Decrypt asymetrically with private keys
    const unencrypted = await decryptAsymmetrically(chainConnect, {
      encrypted: encryptedArray,
      privateKeys,
    })

    // Optionally re-encrypt result asymmetrically before returning
    return optionallyEncryptReturnValue({ chainConnect, unencrypted, returnAsymmetricOptions })
  } catch (error) {
    const errorMessage = 'Problem encrypting key (or string)'
    logger.logAndThrowError(errorMessage, error)
  }

  return { decryptedResult: null, asymmetricEncryptedString: null }
}
