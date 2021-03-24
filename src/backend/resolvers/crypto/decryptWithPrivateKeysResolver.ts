import { AsymmetricEncryptedString, Context, DecryptWithPrivateKeysParams, ErrorType } from '../../../models'
import { ServiceError } from '../../../helpers/errors'
import { getChain } from '../../chains/chainConnection'
import { isNullOrEmpty } from '../../../helpers'
import { decryptPrivateKeys, decryptAsymmetrically, optionallyEncryptReturnValue } from './cryptoHelpers'

/**
 *  Decrypts an asymmetrically encrypted payload using a private keys
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
  const {
    chainType,
    encrypted,
    asymmetricEncryptedPrivateKeys,
    symmetricEncryptedPrivateKeys,
    symmetricOptionsForEncryptedPrivateKeys,
    returnAsymmetricOptions,
  } = params
  const chainConnect = await getChain(chainType, context)
  const { logger } = context

  // might also need to check for symmetric options
  if (
    !isNullOrEmpty(symmetricEncryptedPrivateKeys) &&
    isNullOrEmpty(symmetricOptionsForEncryptedPrivateKeys?.password)
  ) {
    const msg = `Password is required to decrypt private key.`
    throw new ServiceError(msg, ErrorType.BadParam, 'decryptWithPrivateKeysResolver')
  }

  if (!asymmetricEncryptedPrivateKeys && !symmetricEncryptedPrivateKeys) {
    const msg = `You should provide asymmetricEncryptedPrivateKeys OR symmetricEncryptedPrivateKeys - Neither were provided.`
    throw new ServiceError(msg, ErrorType.BadParam, 'decryptWithPrivateKeysResolver')
  }

  // extract encrypted keys
  const privateKeys = await decryptPrivateKeys({
    symmetricEncryptedPrivateKeys,
    asymmetricEncryptedPrivateKeys,
    symmetricOptions: symmetricOptionsForEncryptedPrivateKeys,
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
