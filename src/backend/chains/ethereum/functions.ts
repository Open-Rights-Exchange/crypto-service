import { AsymmetricEncryptedString, GenerateKeysParams, SymmetricEncryptedString } from '../../models'

/**
 *  Creates one or more new public/private key pairs using the curve specified
 *  Returns: an array of symmetrically and/or asymmetrically encrypted items
 */
export function generateKeys(
  params: GenerateKeysParams,
): {
  symmetricEncryptedStrings: SymmetricEncryptedString[]
  asymmetricEncryptedStrings: AsymmetricEncryptedString[]
} {
  return {
    symmetricEncryptedStrings: [],
    asymmetricEncryptedStrings: [],
  }
}
