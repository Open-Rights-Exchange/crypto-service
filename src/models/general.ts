import { Analytics } from '../backend/services/segment/resolvers'
import { Logger } from '../helpers/logger'
import { AsymmetricEncryptedString, ChainType, PrivateKey, PublicKey } from './chain'

export interface Lookup {
  [key: string]: any
}

export type AppId = string

export type Context = {
  /** appId of authenticated user or agent */
  appId?: AppId
  analytics: Analytics
  chainType: ChainType
  constants: Constants
  logger: Logger
  processId: string
  requestDateTime: Date
}

export type Settings = {
  tracingEnabled: boolean
}

/** service configuration state */
export type Config = {
  constants: Constants
  /** not yet implemented */
  settings: any
}

export type Constants = {
  APP_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: number
  APP_NAME: string
  BASE_PUBLIC_KEY: string
  BASE_PRIVATE_KEY: string
  BUILD_VERSION?: string
  DEFAULT_PROCESS_ID: string
  DEPLOY_DATE?: string
  ENVIRONMENT: string
  ENV_HASH?: string
  ENV_VERSION?: string
  HOURS_FOR_TIMEOUT_LOCK: number
  MINUTES_FOR_FIRST_LOCK: number
  MINUTES_FOR_MORE_LOCK: number
  MINUTES_FOR_SECOND_LOCK: number
  MONGO_TIMEOUT: number
  ROLLBAR_POST_WRITE_SERVER_KEY: string
  SEGMENT_WRITE_KEY: string
  TRANSPORT_KEY_EXPIRE_IN_SECONDS?: number
}

export const DEFAULT_SIGNATURE_ENCODING = 'utf8'

export type Hash = string
export type SaltName = string

/** Options for asym encryption */
export type AsymmetricOptions = {
  /** array of public keys - in order to be used for asym encryption wrapping */
  publicKeys: PublicKey[]
  /** chain type for provided publicKeys - nochain = secp256k1 uncompressed */
  publicKeysChainType?: ChainType
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

/** Symmetric encryption options with encrypted password (used by API endpoints)
 *  transportEncryptedPassword is base64 encoded authToken */
export type SymmetricOptionsParam =
  | ({ transportEncryptedPassword: string } & SymmetricEccOptions)
  | ({ transportEncryptedPassword: string } & SymmetricEd25519Options)

/** Temporary public/private key pair used for encrypting data sent to this service */
export type TransportKey = {
  publicKey: PublicKey
  privateKey?: PrivateKey
  privateKeyEncrypted?: AsymmetricEncryptedString
}
