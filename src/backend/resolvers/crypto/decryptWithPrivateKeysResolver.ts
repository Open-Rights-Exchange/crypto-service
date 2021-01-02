import { AsymmetricEncryptedString, Context, DecryptWithPrivateKeysParams, ErrorType } from '../../../models'
import { ServiceError } from '../../../helpers/errors'
import { getChain } from '../../chains/chainConnection'
import { assertValidChainType } from '../../../helpers'
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

  // Decrypt asymmetrically with private keys
  const unencrypted = await decryptAsymmetrically(chainConnect, {
    encrypted,
    privateKeys,
  })

  // Optionally re-encrypt result asymmetrically before returning
  return optionallyEncryptReturnValue({ chainConnect, unencrypted, returnAsymmetricOptions })
}
