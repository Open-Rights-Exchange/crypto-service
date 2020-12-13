import {
  AsymmetricEncryptedItem,
  ChainType,
  Context,
  GenerateKeysParams,
  PublicKey,
  SymmetricEncryptedItem,
} from '../models'
import { Transaction } from '../models/chainjs'

export interface IChainFunctions {
  /** creates one or more new public/private key pairs using the curve specified
   *  returns an array of symmetrically and/or asymmetrically encrypted items
   */
  generateKeys(
    params: GenerateKeysParams,
  ): {
    symmetricEncryptedItems: SymmetricEncryptedItem[]
    asymmetricEncryptedItems: AsymmetricEncryptedItem[]
  }

  // TODO
  // sign(): void
  // decrypt(): void
  // encrypt(): void
  // recoverAndReencrypt(): void
}
