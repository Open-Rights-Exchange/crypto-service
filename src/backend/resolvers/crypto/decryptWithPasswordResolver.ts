import { AsymmetricEncryptedString, Context, DecryptWithPasswordParams } from '../../../models'
import { getChain } from '../../chains/chainConnection'
import { decryptSymmetrically, mapSymmetricOptionsParam, optionallyEncryptReturnValue } from './cryptoHelpers'

/**
 *  Decrypts a symmetrically encrypted payload using a password
 *  If returnAsymmetricOptions is specified, the decrypted item is encrypted with this public key before being returned
 *  Returns: the decrypted string OR an asymmetrically re-encrypted payload (using returnAsymmetricOptions)
 */
export async function decryptWithPasswordResolver(
  params: DecryptWithPasswordParams,
  context: Context,
): Promise<{
  decryptedResult?: string
  encryptedResult?: AsymmetricEncryptedString
}> {
  const { returnAsymmetricOptions, chainType, encrypted, symmetricOptions } = params
  const chainConnect = await getChain(chainType, context)

  const symOptions = await mapSymmetricOptionsParam(symmetricOptions, context)

  // Decrypt symmetrically with password
  const unencrypted = await decryptSymmetrically(chainConnect, {
    encrypted,
    options: symOptions,
  })

  // Optionally re-encrypt result asymmetrically before returning
  return optionallyEncryptReturnValue({ chainConnect, unencrypted, returnAsymmetricOptions })
}
