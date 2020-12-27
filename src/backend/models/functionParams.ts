import {
  AsymmetricEncryptedString,
  AsymmetricOptions,
  ChainType,
  PublicKey,
  SymmetricEccOptions,
  SymmetricEd25519Options,
  SymmetricEncryptedString,
} from './index'
import { ModelsCryptoAsymmetric, ModelsCryptoEcc, ModelsCryptoEd25519, PrivateKey } from './chainjs'
import { AsymmetricEncryptedData, SymmetricEncryptedData } from './general'
import { ChainConnection } from '../chains/chainConnection'

export type DecryptPrivateKeysParams = {
  symmetricEncryptedPrivateKeys: SymmetricEncryptedString | SymmetricEncryptedData[] | SymmetricEncryptedData
  asymmetricEncryptedPrivateKeys: AsymmetricEncryptedString | AsymmetricEncryptedData[] | AsymmetricEncryptedData
  symmetricOptions: SymmetricEccOptions | SymmetricEd25519Options
  password: string
  chainConnect: ChainConnection
}

export type DecryptWithPasswordParams = {
  /** chain/curve used to encrypt */
  chainType: ChainType
  /** Stringified JSON of encrypted payload - value to decrypt */
  encrypted: SymmetricEncryptedString | SymmetricEncryptedData
  /** (optional) options to re-encrypt result before returning it */
  returnAsymmetricOptions?: AsymmetricOptions
  /** options used to originally encrypt the payload */
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options
  /** password used to encrypt symmetrically */
  password: string
}

export type DecryptWithPrivateKeysParams = {
  /** chain/curve used to encrypt */
  chainType: ChainType
  /** Stringified JSON of encrypted payload - value to decrypt */
  encrypted: AsymmetricEncryptedString | AsymmetricEncryptedData
  /** Stringified JSON of encrypted private key(s) */
  asymmetricEncryptedPrivateKeys?: AsymmetricEncryptedString | AsymmetricEncryptedData[]
  /** Stringified JSON of encrypted private key(s) */
  symmetricEncryptedPrivateKeys?: SymmetricEncryptedString | SymmetricEncryptedData[]
  /** (optional) options used to encrypt the private keys */
  symmetricOptionsForEncryptedPrivateKeys?: SymmetricEccOptions | SymmetricEd25519Options
  /** password used to encrypt symmetrically */
  password: string
  /** (optional) options to re-encrypt result before returning it */
  returnAsymmetricOptions?: AsymmetricOptions
}

export type SignParams = {
  /** chain/curve to use to sign */
  chainType: ChainType
  /** value to sign */
  toSign: string
  /** Stringified JSON of encrypted payload - one or more privateKeys to sign with (encrypted asymmetrically) */
  asymmetricEncryptedPrivateKeys?: AsymmetricEncryptedString | AsymmetricEncryptedData[]
  /** Stringified JSON of encrypted payload - one or more privateKeys to sign with (encrypted symmetrically) */
  symmetricEncryptedPrivateKeys?: SymmetricEncryptedString | SymmetricEncryptedData[]
  /** options used to originally encrypt symmetricEncryptedPrivateKeys */
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options
  /** password used to encrypt symmetrically */
  password: string
}

export type EncryptParams = {
  /** chain/curve to use to encrypt */
  chainType: ChainType
  /** value to encrypt */
  toEncrypt: string
  asymmetricOptions?: AsymmetricOptions
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options
  /** password used to encrypt symmetrically */
  password: string
}

export type GenerateKeysParams = {
  /** chain to use to generate keys */
  chainType: ChainType
  /** number of keys to generate - default is 1 */
  keyCount?: number
  asymmetricOptions?: AsymmetricOptions
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options
  /** password used to encrypt symmetrically */
  password: string
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
  encrypted: SymmetricEncryptedString | SymmetricEncryptedData
  /** password used to encrypt symmetrically */
  password: string
  options: ModelsCryptoEcc.EccEncryptionOptions | ModelsCryptoEd25519.Ed25519PasswordEncryptionOptions
}

export type DecryptAsymmetricallyParams = {
  /** Stringified JSON of encrypted (asymmmetric) payload */
  encrypted:
    | AsymmetricEncryptedString
    | AsymmetricEncryptedString[]
    | AsymmetricEncryptedData
    | AsymmetricEncryptedData[]
  privateKeys: PrivateKey[]
}

export type DecryptWithBasePrivateKey = {
  encrypted: AsymmetricEncryptedString | string
}
