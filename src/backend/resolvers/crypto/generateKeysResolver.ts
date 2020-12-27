import {
  AsymmetricEncryptedString,
  Context,
  EncryptParams,
  GenerateKeysParams,
  SymmetricEncryptedString,
} from '../../models'
import { ServiceError } from '../errors'
import { getChain } from '../../chains/chainConnection'
import { assertValidChainType } from '../../helpers'
import { encryptResolver } from './encryptResolver'

export type GenerateKeyResult = {
  publicKey: PublicKeyCredential
  symmetricEncryptedString: SymmetricEncryptedString
  asymmetricEncryptedString: AsymmetricEncryptedString
}

/**
 *  Creates one or more new public/private key pairs using the curve specified
 *  Returns: an array of symmetrically and/or asymmetrically encrypted items
 */
export async function generateKeysResolver(params: GenerateKeysParams, context: Context): Promise<GenerateKeyResult[]> {
  const results: GenerateKeyResult[] = []

  assertValidChainType(params?.chainType)
  const chainConnect = await getChain(params?.chainType, context)
  const { chain } = chainConnect
  const count = params?.keyCount ? Math.round(params?.keyCount) : 1

  // key n set of public/private keys - encrypting the private keys
  for (let index = 0; index < count; index += 1) {
    const keys = await chain.generateKeyPair()
    const encryptParams: EncryptParams = {
      chainType: params?.chainType,
      asymmetricOptions: params?.asymmetricOptions,
      symmetricOptions: params?.symmetricOptions,
      password: params?.password,
      toEncrypt: keys?.privateKey,
    }
    // encrypt and add to array for results
    const { asymmetricEncryptedString, symmetricEncryptedString } = await encryptResolver(encryptParams, context)
    const resultItem: Partial<GenerateKeyResult> = {
      publicKey: keys?.publicKey,
    }
    if (symmetricEncryptedString) resultItem.symmetricEncryptedString = symmetricEncryptedString
    if (asymmetricEncryptedString) resultItem.asymmetricEncryptedString = asymmetricEncryptedString
    results.push(resultItem as GenerateKeyResult)
  }
  return results
}
