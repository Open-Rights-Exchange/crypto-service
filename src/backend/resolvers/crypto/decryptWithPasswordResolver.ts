import { AsymmetricEncryptedString, Context, DecryptWithPasswordParams } from '../../models'
import { ServiceError } from '../errors'
import { getChain } from '../../chains/chainConnection'
import { assertValidChainType } from '../../helpers'
import { decryptSymmetrically, mapSymmetricOptionsParam, optionallyEncryptReturnValue } from './cryptoHelpers'

/**
 *  Decrypts a symmetrically encrypted payload using a password (in the authToken)
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
  assertValidChainType(params?.chainType)
  const { password, returnAsymmetricOptions, chainType, encrypted, symmetricOptions } = params
  const chainConnect = await getChain(chainType, context)
  const { chain } = chainConnect
  const { logger } = context

  const keys = await chain.generateKeyPair()
  const { symmetricEccOptions, symmetricEd25519Options } = await mapSymmetricOptionsParam(symmetricOptions, context)

  // Decrypt symmetrically with password
  const unencrypted = await decryptSymmetrically(chainConnect, {
    encrypted,
    password,
    options: symmetricEccOptions || symmetricEd25519Options,
  })

  // Optionally re-encrypt result asymmetrically before returning
  return optionallyEncryptReturnValue({ chainConnect, unencrypted, returnAsymmetricOptions })
}
