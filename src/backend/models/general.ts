import { Logger } from 'aikon-js'
import { Crypto } from './chainjs'

export interface Lookup {
  [key: string]: any
}

export type AppId = string

export type Context = {
  /** appId of authenticated user or agent */
  appId?: AppId
  processId: string
  logger: Logger
}

export const DEFAULT_SIGNATURE_ENCODING = 'utf8'

export type Hash = string
export type PublicKey = string
export type PrivateKey = string
export type SaltName = string
export type AsymmetricEncryptedString = Crypto.Asymmetric.AsymmetricEncryptedDataString
export type AsymmetricEncryptionOptions = Crypto.Asymmetric.EciesOptions
export type AsymmetricEncryptedData = Crypto.Asymmetric.AsymmetricEncryptedData
export type SymmetricEncryptedString =
  | Crypto.AesCrypto.AesEncryptedDataString
  | Crypto.Ed25519Crypto.Ed25519EncryptedDataString
export type SymmetricEncryptedData = Crypto.AesCrypto.AesEncryptedData | Crypto.Ed25519Crypto.Ed25519EncryptedData
export type SymmetricPassword = string

/** Flavor of chain network */
export enum ChainPlatformType {
  Algorand = 'algorand',
  Eos = 'eos',
  Ethereum = 'ethereum',
}

/** Supported chain types */
export enum ChainType {
  AlgorandV1 = 'algorand',
  EosV2 = 'eos',
  EthereumV1 = 'ethereum',
}

/** Decrypted Athorization token sent (encrypted) by caller
 *  Ensures that the request is coming from an authorized called
 *  and the request is only executed/authorized once
 *  Optionally includes symmetric password for encryption/decryption */
export type AuthToken = {
  /** full url of request (server url and api path) */
  url: string
  /** hash of stringified JSON object of request body set to function along with this authToken */
  payloadHash: Hash
  validFrom: Date
  validTo: Date
  secrets?: {
    /** Symmetric password used to decrypt a symmetrically encrypted payload (that was, for example, sent in the request) */
    password?: SymmetricPassword
  }
}

/** Options for asym encryption */
export type AsymmetricOptions = {
  /** array of public keys - in order to be used for asym encryption wrapping */
  publicKeys: PublicKey[]
  /** optional initialization vector */
  iv?: string
  /** any data or secret to be included in encrypted result */
  s1?: string
  /** any data or secret to be included in encrypted result */
  s2?: string
}

/** Options for ECC sym encryption (along with password) */
export type SymmetricEccOptions = {
  /** nubmer of iterations */
  iter?: number
  /** name of salt secret - must match a saltName registered on the server */
  saltName?: string
  /** salt value - if provided, this is used instead of saltName */
  salt?: string
}

/** Options for ED25519 sym encryption using (along with password) */
export type SymmetricEd25519Options = {
  /** nubmer of iterations */
  N?: number
  /** name of salt secret - must match a saltName registered on the server */
  saltName?: string
  /** salt value - if provided, this is used instead of saltName */
  salt?: string
}
