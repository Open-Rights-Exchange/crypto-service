import {
  AsymmetricEncryptedString,
  AsymmetricOptions,
  ChainType,
  PublicKey,
  SymmetricEccOptions,
  SymmetricEd25519Options,
  SymmetricEncryptedString,
} from './index'
import {
  AsymmetricEncryptedData,
  ModelsCryptoAsymmetric,
  ModelsCryptoEcc,
  ModelsCryptoEd25519,
  PrivateKey,
  SymmetricEncryptedData,
} from './chain'
import { ChainConnection } from '../backend/chains/chainConnection'
import { AppId } from './general'

export type DecryptPrivateKeysParams = {
  symmetricEncryptedPrivateKeys?: SymmetricEncryptedString | SymmetricEncryptedData[] | SymmetricEncryptedData
  asymmetricEncryptedPrivateKeys?: AsymmetricEncryptedString | AsymmetricEncryptedData[] | AsymmetricEncryptedData
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options
  chainConnect: ChainConnection
}

export type DecryptWithPasswordParams = {
  /** chain/curve used to encrypt */
  chainType: ChainType
  /** Stringified JSON of encrypted payload - value to decrypt */
  encrypted: SymmetricEncryptedString | SymmetricEncryptedData
  /** (optional) options to re-encrypt result before returning it */
  returnAsymmetricOptions?: AsymmetricOptions[]
  /** options used to originally encrypt the payload */
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options
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
  /** (optional) options to re-encrypt result before returning it */
  returnAsymmetricOptions?: AsymmetricOptions[]
}

export type RecoverAndReencryptResolverParams = {
  /** chain/curve used to encrypt */
  chainType: ChainType
  /** Stringified JSON of encrypted asym payload - value to decrypt */
  encrypted: AsymmetricEncryptedString | AsymmetricEncryptedData
  /** Stringified JSON of encrypted private key(s) */
  asymmetricEncryptedPrivateKeys?: AsymmetricEncryptedString | AsymmetricEncryptedData[]
  /** (optional) options used to re-encrypt results symmetrically */
  symmetricOptionsForReencrypt?: SymmetricEccOptions | SymmetricEd25519Options
  /** (optional) options used to re-encrypt results asymmetrically */
  asymmetricOptionsForReencrypt?: AsymmetricOptions[]
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
}

export type EncryptParams = {
  /** chain/curve to use to encrypt */
  chainType: ChainType
  /** value to encrypt */
  toEncrypt: string
  asymmetricOptions?: AsymmetricOptions[]
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options
}

export type GenerateKeysParams = {
  /** chain to use to generate keys */
  chainType: ChainType
  /** number of keys to generate - default is 1 */
  keyCount?: number
  asymmetricOptions?: AsymmetricOptions[]
  symmetricOptions?: SymmetricEccOptions | SymmetricEd25519Options
}

export type EncryptAsymmetricallyParams = {
  unencrypted: string
  publicKeys: PublicKey[]
  publicKeysChainType?: ChainType
  options?: ModelsCryptoAsymmetric.EciesOptions
}

export type EncryptSymmetricallyParams = {
  unencrypted: string
  options: SymmetricEccOptions | SymmetricEd25519Options
}

export type DecryptSymmetricallyParams = {
  /** Stringified JSON of encrypted (symmmetric) payload */
  encrypted: SymmetricEncryptedString | SymmetricEncryptedData
  options: SymmetricEccOptions | SymmetricEd25519Options
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

export type GetTransportPublicKeyParams = {
  // app for which this key will be used (defaults to current app)
  appId?: AppId
  // max number of times this key can be used before its deleted (default is 1)
  maxUseCount?: number
  /** string to sign using service's public key */
  nonce: string
}

export type VerifyPublcKeyParams = {
  /** string to sign using service's public key */
  nonce: string
}
