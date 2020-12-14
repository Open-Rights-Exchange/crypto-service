import {
  AsymmetricEncryptedItem,
  AsymmetricOptions,
  AuthToken,
  ChainType,
  PublicKey,
  SymmetricEccOptions,
  SymmetricEd25519Options,
  SymmetricEncryptedItem,
} from './index'
import { ModelsCryptoAsymmetric, ModelsCryptoEcc, ModelsCryptoEd25519 } from './chainjs'

export type DecryptWithPasswordParams = {
  /** chain/curve to use to encrypt */
  chainType: ChainType
  /** value to decrypt */
  encryptedPayload: SymmetricEncryptedItem
  /** (optional) options to re-encrypt result before returning it */
  returnAsymmetricOptions?: AsymmetricOptions
  /** options used to originally encrypt the payload */
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options
  /** encrypted auth token */
  authToken: AuthToken
}

export type EncryptParams = {
  /** chain/curve to use to encrypt */
  chainType: ChainType
  /** value to encrypt */
  payload: string
  asymmetricOptions?: AsymmetricOptions
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options
  /** encrypted auth token */
  authToken: AuthToken
}

export type GenerateKeysParams = {
  /** chain to use to generate keys */
  chainType: ChainType
  /** number of keys to generate - default is 1 */
  keyCount?: number
  asymmetricOptions?: AsymmetricOptions
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options
  /** encrypted auth token */
  authToken: AuthToken
}

export type EncryptAsymmetricallyParams = {
  unencrypted: string
  publicKeys: PublicKey[]
  options?: ModelsCryptoAsymmetric.EciesOptions
}

export type EncryptSymmetricallyParams = {
  unencrypted: string
  password: string
  options: ModelsCryptoEcc.EccEncryptionOptions | ModelsCryptoEd25519.Ed25519PasswordEncryptionOptions
}

export type DecryptSymmetricallyParams = {
  encrypted: SymmetricEncryptedItem
  password: string
  options: ModelsCryptoEcc.EccEncryptionOptions | ModelsCryptoEd25519.Ed25519PasswordEncryptionOptions
}
