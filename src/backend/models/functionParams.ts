import {
  AsymmetricEncryptedString,
  AsymmetricOptions,
  AuthToken,
  ChainType,
  PublicKey,
  SymmetricEccOptions,
  SymmetricEd25519Options,
  SymmetricEncryptedString,
} from './index'
import { ModelsCryptoAsymmetric, ModelsCryptoEcc, ModelsCryptoEd25519, PrivateKey } from './chainjs'

export type DecryptWithPasswordParams = {
  /** chain/curve to use to encrypt */
  chainType: ChainType
  /** Stringified JSON of encrypted payload - value to decrypt */
  encryptedPayload: SymmetricEncryptedString
  /** (optional) options to re-encrypt result before returning it */
  returnAsymmetricOptions?: AsymmetricOptions
  /** options used to originally encrypt the payload */
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options
  /** encrypted auth token */
  authToken: AuthToken
}

export type SignParams = {
  /** chain/curve to use to encrypt */
  chainType: ChainType
  /** value to sign */
  payloadToSign: string
  /** Stringified JSON of encrypted payload - one or more privateKeys to sign with (encrypted symmetrically) */
  symmetricEncryptedPrivateKeys?: SymmetricEncryptedString[]
  /** Stringified JSON of encrypted payload - one or more privateKeys to sign with (encrypted asymmetrically) */
  asymmetricEncryptedPrivateKeys?: AsymmetricEncryptedString[]
  /** options used to originally encrypt symmetricEncryptedPrivateKeys */
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
  /** Stringified JSON of encrypted (symmmetric) payload */
  encrypted: SymmetricEncryptedString
  password: string
  options: ModelsCryptoEcc.EccEncryptionOptions | ModelsCryptoEd25519.Ed25519PasswordEncryptionOptions
}

export type DecryptAsymmetricallyParams = {
  /** Stringified JSON of encrypted (asymmmetric) payload */
  encrypted: AsymmetricEncryptedString
  privateKeys: PrivateKey[]
}
