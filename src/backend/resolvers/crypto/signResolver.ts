import { Context, DEFAULT_SIGNATURE_ENCODING, SignParams } from '../../../models'
import { getChain } from '../../chains/chainConnection'
import { assertValidChainType, ServiceError } from '../../../helpers'
import { decryptPrivateKeys } from './cryptoHelpers'

/**
 *  Encrypt a string using one or more private keys
 *  If symmetricEncryptedPrivateKeys is provided, they will be decrypted symmetricOptions and password (in the authToken)
 *  If asymmetricEncryptedPrivateKeys is provided, they will be decrypted symmetricOptions and password (in the authToken)
 *  Returns: One or more signatures - one for each privateKey provided
 */
export async function signResolver(params: SignParams, context: Context): Promise<string[]> {
  const {
    asymmetricEncryptedPrivateKeys = [],
    chainType,
    password,
    toSign,
    symmetricEncryptedPrivateKeys = [],
    symmetricOptions,
  } = params
  assertValidChainType(chainType)
  const chainConnect = await getChain(chainType, context)
  const { chainFunctions } = chainConnect
  const { logger } = context
  const signatures: string[] = []

  // extract encrypted keys
  const privateKeys = await decryptPrivateKeys({
    symmetricEncryptedPrivateKeys,
    asymmetricEncryptedPrivateKeys,
    symmetricOptions,
    password,
    chainConnect,
  })

  // generate a signature for each privateKey
  await Promise.all(
    privateKeys.map(async pk => {
      const signature = await chainFunctions.sign(toSign, pk, DEFAULT_SIGNATURE_ENCODING)
      signatures.push(signature)
    }),
  )

  return signatures
}
