import { Asymmetric, Context, PublicKey, Signature, VerifyPublcKeyParams } from '../../../models'

/**
 *  Returns this service's base public key along with a proof that it has access to the corresponding private key
 *  Nonce is any random string
 *  Returns: an object that includes the base public key and a signature (the nonce signed with the service's private key)
 */
export async function verifyPublicKeyResolver(
  params: VerifyPublcKeyParams,
  context: Context,
): Promise<{ publicKey: PublicKey; signature: Signature }> {
  const { nonce } = params
  const signature = await Asymmetric.sign(nonce, context.constants.BASE_PRIVATE_KEY)

  return {
    publicKey: context.constants.BASE_PUBLIC_KEY,
    signature,
  }
}
