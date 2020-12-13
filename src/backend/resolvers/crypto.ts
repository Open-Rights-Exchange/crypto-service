import { AsymEncryptedDataString, EncryptedDataString, ModelsCryptoAsymmetric } from '../models/chainjs'
import { isNullOrEmpty, isAnObject } from 'aikon-js'
import { analyticsEvent } from '../services/segment/resolvers'
import {
  AnalyticsEvent,
  AppId,
  AsymmetricEncryptedItem,
  AsymmetricOptions,
  Context,
  EncryptAsymmetricallyParams,
  EncryptSymmetricallyParams,
  GenerateKeysParams,
  SymmetricEccOptions,
  SymmetricEd25519Options,
  SymmetricEncryptedItem,
} from '../models'
import { ChainConnection, getChain } from '../chains/chainConnection'
import { assertValidChainType } from '../models/helpers'

/**
 *  Creates one or more new public/private key pairs using the curve specified
 *  Returns: an array of symmetrically and/or asymmetrically encrypted items
 */
export async function generateKeysResolver(
  params: GenerateKeysParams,
  context: Context,
  appId: AppId,
): Promise<{
  symmetricEncryptedItems: SymmetricEncryptedItem[]
  asymmetricEncryptedItems: AsymmetricEncryptedItem[]
}> {
  assertValidChainType(params?.chainType)
  const chainConnect = await getChain(params?.chainType, context, appId)
  const { chain } = chainConnect
  const { logger } = context
  let asymmetricEncryptedItems: AsymmetricEncryptedItem[] = []
  let symmetricEncryptedItems: SymmetricEncryptedItem[] = []

  try {
    const keys = await chain.generateKeyPair()
    const { symmetricEccOptions, symmetricEd25519Options}  = mapSymmetricOptionsParam(params?.symmetricOptions)

    // TODO: handle authToken to extract password
    const password = 'mypassword'

    const { publicKeys } = params?.asymmetricOptions
    const shouldEncryptSym = !isNullOrEmpty(password)
    const shouldEncryptAsym = !isNullOrEmpty(publicKeys)

    // Encrypt symetrically with password
    if (shouldEncryptSym) {
      const encryptedPrivateKey = await encryptSymmetrically(chainConnect, {
        unencrypted: keys?.privateKey,
        password,
        options: symmetricEccOptions || symmetricEd25519Options,
      })
      symmetricEncryptedItems.push(encryptedPrivateKey)
    }
    // Encrypt asymetrically with publicKey(s)
    if (shouldEncryptAsym) {
      const options = mapAsymmetricOptionsParam(params?.asymmetricOptions)
      const encryptedPrivateKey = await encryptAsymmetrically(chainConnect, {
        unencrypted: keys?.privateKey,
        publicKeys,
        ...options,
      })
      asymmetricEncryptedItems.push(encryptedPrivateKey)
    }
  } catch (error) {
    const errorMessage = 'Problem encrypting key (or string)'
    logger.logAndThrowError(errorMessage, error)
  }

  return { asymmetricEncryptedItems, symmetricEncryptedItems }
}

/** lookup the salt secret string using a well-known (pre-registered) name */
export function mapSaltNameToSalt(saltName: string) {
  // TODO: handle get salt from params?.symmetricOptions?.saltName
  if(!saltName) {
    return ''
  }
  return 'todo-lookup-salt'
}

/** Map incoming params to ModelsCryptoAsymmetric.EciesOptions */
export function mapAsymmetricOptionsParam(asymmetricOptionsFromParams: AsymmetricOptions) {
  const { iv, s1, s2 } = asymmetricOptionsFromParams
  let options: ModelsCryptoAsymmetric.EciesOptions = {}
  if (iv) options.iv = iv
  if (s1) options.s1 = s1
  if (s2) options.s2 = s2
  return options
}

/** Map incoming params to SymmetricEccOptions an/or SymmetricEd25519Options */
export function mapSymmetricOptionsParam(symmetricOptionsFromParams: SymmetricEccOptions | SymmetricEd25519Options) {
  let symmetricEccOptions: SymmetricEccOptions = {}
  let symmetricEd25519Options: SymmetricEd25519Options = {}
  // handle ECC 
  {
    const { iter, saltName, salt } = symmetricOptionsFromParams as SymmetricEccOptions
    if (iter) symmetricEccOptions.iter = iter
    if (salt) {
      symmetricEccOptions.salt = salt 
    } else if (saltName) {
      symmetricEccOptions.salt = mapSaltNameToSalt(saltName)
    }
  }
  // handle Ed25519 
  {
    const { N, saltName, salt } = symmetricOptionsFromParams as SymmetricEd25519Options
    if (N) symmetricEd25519Options.N = N
    if (salt) {
      symmetricEd25519Options.salt = salt 
    } else if (saltName) {
      symmetricEd25519Options.salt = mapSaltNameToSalt(saltName)
    }
  }
  // return either Ecc or Ed25519 
  if(!isNullOrEmpty(symmetricEccOptions)) {
    return { symmetricEccOptions, isEcc: true, isEd25519: false }
  }
  if(!isNullOrEmpty(symmetricEd25519Options)) {
    return { symmetricEd25519Options, isEcc: false, isEd25519: true }
  }

}

/** Encrypts a string symmetrically - using a password and optional salt */
export async function encryptAsymmetrically(
  chainConnect: ChainConnection,
  params: EncryptAsymmetricallyParams,
): Promise<AsymEncryptedDataString> {
  const { chain } = chainConnect
  return chain.encryptWithPublicKeys(params?.unencrypted, params?.publicKeys, params?.options)
}

/** Encrypts a string symmetrically - using a password and optional salt */
export async function encryptSymmetrically(
  chainConnect: ChainConnection,
  params: EncryptSymmetricallyParams,
): Promise<EncryptedDataString> {
  const { chain } = chainConnect
  return chain.encryptWithPassword(params?.unencrypted, params?.password, params?.options)
}

/**
 *  Creates one or more new public/private key pairs using the curve specified
 *  Returns: an array of symmetrically and/or asymmetrically encrypted items
 */
export async function encrypt(
  params: GenerateKeysParams,
  context: Context,
  appId: AppId,
): Promise<{
  symmetricEncryptedItems: SymmetricEncryptedItem[]
  asymmetricEncryptedItems: AsymmetricEncryptedItem[]
}> {
  const { chain } = await getChain(params?.chainType, context, appId)
  const { logger } = context
  let encryptedValue
  try {
    // encryptedValue = chain.encryptWithPassword(value, password, encryptionOptions)
  } catch (error) {
    encryptedValue = null
    const errorMessage = 'Problem encrypting key (or string)'
    logger.logAndThrowError(errorMessage, error)
  }

  return encryptedValue
}

// type DecryptPasswordParams = {
//   context: Context
//   encryptedPassword: EncryptedDataString
//   /** a string used as a seed to encrypt/decrypt encryptedPassword */
//   passwordKey: string
//   salt: string
//   onFailAnalyticsData?: any
// }

// /** Decrypt credential password - using standard AesCrypto (not chain-specific) */
// export function decryptPassword({
//   context,
//   encryptedPassword,
//   passwordKey,
//   salt,
//   onFailAnalyticsData = {},
// }: DecryptPasswordParams) {
//   const { logger } = context
//   const { userId = 'missing' } = onFailAnalyticsData
//   const errorMessage = 'problem decrypting password'
//   let privateKey

//   try {
//     // Use standard AesCrypto (not chain-specific)
//     privateKey = Crypto.AesCrypto.decryptWithPassword(encryptedPassword, passwordKey, { salt })
//   } catch (error) {
//     privateKey = null
//   }

//   // If decrypt fails or key is empty, throw error
//   if (isNullOrEmpty(privateKey)) {
//     analyticsEvent(userId, AnalyticsEvent.DecryptingKeyFailedBadPassword, onFailAnalyticsData, context)
//     logger.trace(errorMessage)
//     throw new Error(errorMessage)
//   }
//   return privateKey
// }

// type EncryptPasswordParams = {
//   context: Context
//   unencryptedPassword: string
//   /** a string used as a seed to encrypt unencryptedPassword */
//   passwordKey: string
//   salt: string
// }

// /** Encrypt credential password - using standard AesCrypto (not chain-specific) */
// export function encryptPassword({ context, unencryptedPassword, passwordKey, salt }: EncryptPasswordParams) {
//   const { logger } = context
//   let password

//   try {
//     // Use standard AesCrypto (not chain-specific)
//     password = Crypto.AesCrypto.encryptWithPassword(unencryptedPassword, passwordKey, { salt })
//   } catch (error) {
//     logger.logAndThrowError('Problem encrypting credential password', error)
//   }

//   return password
// }

// type DecryptForChainWithPasswordParams = {
//   chainConnect: ChainConnection
//   encryptedValue: EncryptedDataString
//   password: string
//   /** options depend on the chain-specific EncryptionOptions - may include: salt, iter etc. */
//   encryptionOptions?: any
//   onFailAnalyticsData?: any
// }

// export function decryptForChainWithPassword({
//   chainConnect,
//   encryptedValue,
//   password,
//   encryptionOptions,
//   onFailAnalyticsData = {},
// }: DecryptForChainWithPasswordParams) {
//   const { chain, context } = chainConnect
//   const { logger } = context
//   const { userId = 'missing' } = onFailAnalyticsData
//   const errorMessage = 'Problem decrypting key (or string) - Cause: likely bad password'
//   let unencryptedValue

//   if (isAnObject(encryptedValue)) {
//     encryptedValue = Crypto.CryptoHelpers.toEncryptedDataString(JSON.stringify(encryptedValue))
//   }

//   try {
//     unencryptedValue = chain.decryptWithPassword(encryptedValue, password, { ...encryptionOptions })
//   } catch (error) {
//     logger.trace(error)
//     unencryptedValue = null
//   }

//   // If decrypt fails or key is empty, throw error
//   if (isNullOrEmpty(unencryptedValue)) {
//     analyticsEvent(userId, AnalyticsEvent.DecryptingKeyFailedBadPassword, onFailAnalyticsData, context)
//     logger.trace(errorMessage)
//     throw new Error(errorMessage)
//   }
//   return unencryptedValue
// }

// type EncryptForChainWithPasswordParams = {
//   chainConnect: ChainConnection
//   value: string
//   password: string
//   /** options depend on the chain-specific EncryptionOptions - may include: salt, iter etc. */
//   encryptionOptions?: any
// }

// /** Encrypt a string (using chain-specifc crypto functions)
//  *  Uses a password (and chain-specific encryptionOptions) and returns an EncryptedDataString object */
// export function encryptForChainWithPassword({
//   chainConnect,
//   value,
//   password,
//   encryptionOptions,
// }: EncryptForChainWithPasswordParams): EncryptedDataString {
//   const { chain, context } = chainConnect
//   const { logger } = context
//   const errorMessage = 'Problem encrypting key (or string)'
//   let encryptedValue

//   try {
//     encryptedValue = chain.encryptWithPassword(value, password, encryptionOptions)
//   } catch (error) {
//     encryptedValue = null
//     logger.logAndThrowError(errorMessage, error)
//   }

//   return encryptedValue
// }
