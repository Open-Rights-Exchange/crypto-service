import {
  AsymmetricEncryptedString,
  Context,
  EncryptParams,
  GenerateKeysParams,
  SymmetricEncryptedString,
} from '../../../models'
import { getChain } from '../../chains/chainConnection'
import { encryptResolver } from './encryptResolver'

export type GenerateKeyResult = {
  publicKey: PublicKeyCredential
  symmetricEncryptedString: SymmetricEncryptedString
  asymmetricEncryptedStrings: AsymmetricEncryptedString[]
}

/**
 *  Creates one or more new public/private key pairs using the chain specified
 *  Returns: an array of symmetrically and/or asymmetrically encrypted items
 */
export async function generateKeysResolver(params: GenerateKeysParams, context: Context): Promise<GenerateKeyResult[]> {
  const results: GenerateKeyResult[] = []

  const chainConnect = await getChain(params?.chainType, context)
  const { chainFunctions } = chainConnect
  const count = params?.keyCount ? Math.round(params?.keyCount) : 1

  // key n set of public/private keys - encrypting the private keys
  for (let index = 0; index < count; index += 1) {
    const keys = await chainFunctions.generateKeyPair()

    // Encrypt Symmetrically and/or Asymmetrically
    const encryptParams: EncryptParams = {
      chainType: params?.chainType,
      asymmetricOptions: params?.asymmetricOptions,
      symmetricOptions: params?.symmetricOptions,
      password: params?.password,
      toEncrypt: keys?.privateKey,
    }
    // encrypt and add to array for results
    const { asymmetricEncryptedStrings, symmetricEncryptedString } = await encryptResolver(encryptParams, context)

    // Return result (for each key generated)
    const resultItem: Partial<GenerateKeyResult> = {
      publicKey: keys?.publicKey,
    }
    if (symmetricEncryptedString) resultItem.symmetricEncryptedString = symmetricEncryptedString
    if (asymmetricEncryptedStrings) resultItem.asymmetricEncryptedStrings = asymmetricEncryptedStrings

    results.push(resultItem as GenerateKeyResult)
  }
  return results
}
