import { Asymmetric, ChainType, Context, PublicKey, Signature, GetTransportPublicKeyParams } from '../../../models'
import { getChain } from '../../chains/chainConnection'
import { StateStore } from '../../../helpers/stateStore'
import { saveTransportKey } from '../transportKey'

/**
 *  Returns a single use public key along with a proof that this service has access to a private key that maps to a well-kwown public key
 *  Nonce is any random string
 *  Returns: an object that includes a public key and a signature (which is the nonce signed with the service's private key)
 */
export async function getTransportPublicKeyResolver(
  params: GetTransportPublicKeyParams,
  context: Context,
  state: StateStore,
): Promise<{ transportPublicKey: PublicKey; signature: Signature }> {
  const { constants } = context
  const signature = await Asymmetric.sign(params.nonce, constants.BASE_PRIVATE_KEY)
  // Use generic 'nochain' functions to generateKeyPair
  const chain = await getChain(ChainType.NoChain, context)
  const keyPair = await chain.chainFunctions.generateKeyPair()
  const expiresOn = new Date(context.requestDateTime.getTime() + 1000 * constants.TRANSPORT_KEY_EXPIRE_IN_SECONDS)
  const appId = params?.appId || context.appId
  const maxUseCount = params?.maxUseCount || 1
  // store keyPair in memory (temporarily)
  // state.transportKeyStore.push({ publicKey: keyPair.publicKey, privateKey: keyPair.privateKey, expiresOn })
  const transportKey = { appId, maxUseCount, publicKey: keyPair.publicKey, privateKey: keyPair.privateKey, expiresOn }
  await saveTransportKey(transportKey, context)
  return {
    transportPublicKey: keyPair.publicKey,
    signature,
  }
}
