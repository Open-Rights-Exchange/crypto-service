/* eslint-disable @typescript-eslint/interface-name-prefix */
import {
  AsymmetricEncryptedString,
  ChainType,
  Context,
  GenerateKeysParams,
  PublicKey,
  SymmetricEncryptedString,
} from '../models'
import { Transaction } from '../models/chainjs'

export interface IChainFunctions {
  /** creates one or more new public/private key pairs using the curve specified
   *  returns an array of symmetrically and/or asymmetrically encrypted items
   */
  generateKeys(
    params: GenerateKeysParams,
  ): {
    symmetricEncryptedStrings: SymmetricEncryptedString[]
    asymmetricEncryptedStrings: AsymmetricEncryptedString[]
  }

  // TODO
  // sign(): void
  // decrypt(): void
  // encrypt(): void
  // recoverAndReencrypt(): void
}
