import { Crypto } from '@open-rights-exchange/chainjs'
import { isNullOrEmpty, isAnObject } from 'aikon-js'
import { analyticsEvent } from '../services/segment/resolvers'
import { AnalyticsEvent, Context } from '../models'
// import { ChainConnection } from '../services/chain/connectors'
import { EncryptedDataString } from '../models/chainjs'

type ChainConnection = any // TODO: Do this

type DecryptPasswordParams = {
  context: Context
  encryptedPassword: EncryptedDataString
  /** a string used as a seed to encrypt/decrypt encryptedPassword */
  passwordKey: string
  salt: string
  onFailAnalyticsData?: any
}

/** Decrypt credential password - using standard AesCrypto (not chain-specific) */
export function decryptPassword({
  context,
  encryptedPassword,
  passwordKey,
  salt,
  onFailAnalyticsData = {},
}: DecryptPasswordParams) {
  const { logger } = context
  const { userId = 'missing' } = onFailAnalyticsData
  const errorMessage = 'problem decrypting password'
  let privateKey

  try {
    // Use standard AesCrypto (not chain-specific)
    privateKey = Crypto.AesCrypto.decryptWithPassword(encryptedPassword, passwordKey, { salt })
  } catch (error) {
    privateKey = null
  }

  // If decrypt fails or key is empty, throw error
  if (isNullOrEmpty(privateKey)) {
    analyticsEvent(userId, AnalyticsEvent.DecryptingKeyFailedBadPassword, onFailAnalyticsData, context)
    logger.trace(errorMessage)
    throw new Error(errorMessage)
  }
  return privateKey
}

type EncryptPasswordParams = {
  context: Context
  unencryptedPassword: string
  /** a string used as a seed to encrypt unencryptedPassword */
  passwordKey: string
  salt: string
}

/** Encrypt credential password - using standard AesCrypto (not chain-specific) */
export function encryptPassword({ context, unencryptedPassword, passwordKey, salt }: EncryptPasswordParams) {
  const { logger } = context
  let password

  try {
    // Use standard AesCrypto (not chain-specific)
    password = Crypto.AesCrypto.encryptWithPassword(unencryptedPassword, passwordKey, { salt })
  } catch (error) {
    logger.logAndThrowError('Problem encrypting credential password', error)
  }

  return password
}

type DecryptForChainWithPasswordParams = {
  chainConnect: ChainConnection
  encryptedValue: EncryptedDataString
  password: string
  /** options depend on the chain-specific EncryptionOptions - may include: salt, iter etc. */
  encryptionOptions?: any
  onFailAnalyticsData?: any
}

export function decryptForChainWithPassword({
  chainConnect,
  encryptedValue,
  password,
  encryptionOptions,
  onFailAnalyticsData = {},
}: DecryptForChainWithPasswordParams) {
  const { chain, context } = chainConnect
  const { logger } = context
  const { userId = 'missing' } = onFailAnalyticsData
  const errorMessage = 'Problem decrypting key (or string) - Cause: likely bad password'
  let unencryptedValue

  if (isAnObject(encryptedValue)) {
    encryptedValue = Crypto.CryptoHelpers.toEncryptedDataString(JSON.stringify(encryptedValue))
  }

  try {
    unencryptedValue = chain.decryptWithPassword(encryptedValue, password, { ...encryptionOptions })
  } catch (error) {
    logger.trace(error)
    unencryptedValue = null
  }

  // If decrypt fails or key is empty, throw error
  if (isNullOrEmpty(unencryptedValue)) {
    analyticsEvent(userId, AnalyticsEvent.DecryptingKeyFailedBadPassword, onFailAnalyticsData, context)
    logger.trace(errorMessage)
    throw new Error(errorMessage)
  }
  return unencryptedValue
}

type EncryptForChainWithPasswordParams = {
  chainConnect: ChainConnection
  value: string
  password: string
  /** options depend on the chain-specific EncryptionOptions - may include: salt, iter etc. */
  encryptionOptions?: any
}

/** Encrypt a string (using chain-specifc crypto functions)
 *  Uses a password (and chain-specific encryptionOptions) and returns an EncryptedDataString object */
export function encryptForChainWithPassword({
  chainConnect,
  value,
  password,
  encryptionOptions,
}: EncryptForChainWithPasswordParams): EncryptedDataString {
  const { chain, context } = chainConnect
  const { logger } = context
  const errorMessage = 'Problem encrypting key (or string)'
  let encryptedValue

  try {
    encryptedValue = chain.encryptWithPassword(value, password, encryptionOptions)
  } catch (error) {
    encryptedValue = null
    logger.logAndThrowError(errorMessage, error)
  }

  return encryptedValue
}
