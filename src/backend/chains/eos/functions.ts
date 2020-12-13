import { AsymmetricEncryptedItem, GenerateKeysParams, SymmetricEncryptedItem } from '../../models'

/** 
 *  Creates one or more new public/private key pairs using the curve specified
 *  Returns: an array of symmetrically and/or asymmetrically encrypted items
 */
export function generateKeys(
  params: GenerateKeysParams,
): {
  symmetricEncryptedItems: SymmetricEncryptedItem[]
  asymmetricEncryptedItems: AsymmetricEncryptedItem[]
} {
  return {
    symmetricEncryptedItems: [],
    asymmetricEncryptedItems: [],
  }
}
