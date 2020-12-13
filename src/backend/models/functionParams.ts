
import {
  AsymmetricEncryptedItem,
  AsymmetricOptions,
  AuthToken,
  ChainType,
  PublicKey,
  SymmetricEccOptions,
  SymmetricEd25519Options,
  SymmetricEncryptedItem,
} from '../models'
import { ModelsCryptoAsymmetric, ModelsCryptoEcc, ModelsCryptoEd25519 } from '../models/chainjs'

export type GenerateKeysParams = {
  /** chain to use to generate keys */
  chainType: ChainType
  /** number of keys to generate - default is 1 */
  keyCount?: number
  asymmetricOptions?: AsymmetricOptions,
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options,
  /** encrypted auth token */
  authToken: AuthToken
}

export type EncryptAsymmetricallyParams = {
  unencrypted: string
  publicKeys: PublicKey[],
  options?: ModelsCryptoAsymmetric.EciesOptions,
}

export type EncryptSymmetricallyParams = {
  unencrypted: string
  password: string
  options: ModelsCryptoEcc.EccEncryptionOptions | ModelsCryptoEd25519.Ed25519PasswordEncryptionOptions,
}
