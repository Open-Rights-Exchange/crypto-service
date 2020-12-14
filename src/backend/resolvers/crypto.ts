import { isNullOrEmpty, isAnObject } from 'aikon-js'
import { BASE_PUBLIC_KEY, BASE_PRIVATE_KEY } from '../constants'
import { analyticsEvent } from '../services/segment/resolvers'
import {
  AnalyticsEvent,
  AppId,
  AsymmetricEncryptedItem,
  AsymmetricEncryptedString,
  AsymmetricEncryptionOptions,
  AsymmetricOptions,
  AuthToken,
  Context,
  DecryptAsymmetricallyParams,
  DecryptSymmetricallyParams,
  DecryptWithPasswordParams,
  DEFAULT_SIGNATURE_ENCODING,
  EncryptAsymmetricallyParams,
  EncryptParams,
  EncryptSymmetricallyParams,
  GenerateKeysParams,
  PrivateKey,
  PublicKey,
  SignParams,
  SymmetricEccOptions,
  SymmetricEd25519Options,
  SymmetricEncryptedString,
} from '../models'
import { ChainConnection, getChain } from '../chains/chainConnection'
import { assertValidChainType } from '../models/helpers'
import { asyncForEach, throwNewError } from '../utils/helpers'

export type GenerateKeyResult = {
  publicKey: PublicKeyCredential
  symmetricEncryptedString: SymmetricEncryptedString
  asymmetricEncryptedString: AsymmetricEncryptedString
}

/**
 *  Creates one or more new public/private key pairs using the curve specified
 *  Returns: an array of symmetrically and/or asymmetrically encrypted items
 */
export async function generateKeysResolver(
  params: GenerateKeysParams,
  context: Context,
  appId: AppId,
): Promise<GenerateKeyResult[]> {
  const results: GenerateKeyResult[] = []

  assertValidChainType(params?.chainType)
  const chainConnect = await getChain(params?.chainType, context, appId)
  const { chain } = chainConnect
  const count = params?.keyCount ? Math.round(params?.keyCount) : 1

  // key n set of public/priuvate keys - enbcrypting the private keys
  for (let index = 0; index < count; index += 1) {
    const keys = await chain.generateKeyPair()
    const encryptParams: EncryptParams = {
      chainType: params?.chainType,
      asymmetricOptions: params?.asymmetricOptions,
      symmetricOptions: params?.symmetricOptions,
      authToken: params?.authToken,
      payload: keys?.privateKey,
    }
    // encrypt and add to array for results
    const { asymmetricEncryptedString, symmetricEncryptedString } = await encryptResolver(encryptParams, context, appId)
    const resultItem: Partial<GenerateKeyResult> = {
      publicKey: keys?.publicKey,
    }
    if (symmetricEncryptedString) resultItem.symmetricEncryptedString = symmetricEncryptedString
    if (asymmetricEncryptedString) resultItem.asymmetricEncryptedString = asymmetricEncryptedString
    results.push(resultItem as GenerateKeyResult)
  }
  console.log('results:', results)
  return results
}

/**
 *  Encrypts a string using
 *  Returns: an array of symmetrically and/or asymmetrically encrypted items
 */
export async function encryptResolver(
  params: EncryptParams,
  context: Context,
  appId: AppId,
): Promise<{
  symmetricEncryptedString: SymmetricEncryptedString
  asymmetricEncryptedString: AsymmetricEncryptedString
}> {
  assertValidChainType(params?.chainType)
  const chainConnect = await getChain(params?.chainType, context, appId)
  const { chain } = chainConnect
  const { logger } = context
  let asymmetricEncryptedString: AsymmetricEncryptedString
  let symmetricEncryptedString: SymmetricEncryptedString

  try {
    const keys = await chain.generateKeyPair()
    const { symmetricEccOptions, symmetricEd25519Options } = mapSymmetricOptionsParam(params?.symmetricOptions)

    const { password } = getInfoFromAuthToken(params?.authToken)

    const { publicKeys } = params?.asymmetricOptions
    const shouldEncryptSym = !isNullOrEmpty(password)
    const shouldEncryptAsym = !isNullOrEmpty(publicKeys)

    // Encrypt symetrically with password
    if (shouldEncryptSym) {
      const encryptedPrivateKey = await encryptSymmetrically(chainConnect, {
        unencrypted: params?.payload,
        password,
        options: symmetricEccOptions || symmetricEd25519Options,
      })
      symmetricEncryptedString = encryptedPrivateKey
    }
    // Encrypt asymetrically with publicKey(s)
    if (shouldEncryptAsym) {
      const options = mapAsymmetricOptionsParam(params?.asymmetricOptions)
      const encryptedPrivateKey = await encryptAsymmetrically(chainConnect, {
        unencrypted: params?.payload,
        publicKeys,
        ...options,
      })
      asymmetricEncryptedString = encryptedPrivateKey
    }
  } catch (error) {
    const errorMessage = 'Problem encrypting key (or string)'
    logger.logAndThrowError(errorMessage, error)
  }

  return { asymmetricEncryptedString, symmetricEncryptedString }
}

/**
 *  Decrypts a symmetrically encrypted payload using a password (in the authToken)
 *  If returnAsymmetricOptions is specified, the decrypted item is encrypted with this public key before being returned
 *  Returns: the decrypted string OR an asymmetrically re-encrypted payload (using returnAsymmetricOptions)
 */
export async function decryptWithPasswordResolver(
  params: DecryptWithPasswordParams,
  context: Context,
  appId: AppId,
): Promise<{
  decryptedResult?: string
  encryptedResult?: AsymmetricEncryptedString
}> {
  assertValidChainType(params?.chainType)
  const { returnAsymmetricOptions, chainType, encryptedPayload, symmetricOptions } = params
  const chainConnect = await getChain(chainType, context, appId)
  const { chain } = chainConnect
  const { logger } = context
  let decryptedResult: string
  let encryptedResult: AsymmetricEncryptedString

  try {
    const keys = await chain.generateKeyPair()
    const { symmetricEccOptions, symmetricEd25519Options } = mapSymmetricOptionsParam(symmetricOptions)

    // TODO: handle authToken to extract password
    const password = 'mypassword'

    // Decrypt symetrically with password
    decryptedResult = await decryptSymmetrically(chainConnect, {
      encrypted: encryptedPayload,
      password,
      options: symmetricEccOptions || symmetricEd25519Options,
    })

    // Optionally, re-encrypt result asymmetrically before returning it
    const shouldEncryptAsymResult = !isNullOrEmpty(returnAsymmetricOptions?.publicKeys)
    if (shouldEncryptAsymResult) {
      const options = mapAsymmetricOptionsParam(returnAsymmetricOptions)
      encryptedResult = await encryptAsymmetrically(chainConnect, {
        unencrypted: decryptedResult,
        publicKeys: returnAsymmetricOptions?.publicKeys,
        ...options,
      })
      // dont return result in the clear if we have an encryptedResult
      decryptedResult = null
    }
  } catch (error) {
    const errorMessage = 'Problem encrypting key (or string)'
    logger.logAndThrowError(errorMessage, error)
  }

  return { decryptedResult, encryptedResult }
}

/**
 *  Encrypt a string using one or more private keys
 *  If symmetricEncryptedPrivateKeys is provided, they will be decrypted symmetricOptions and password (in the authToken)
 *  If asymmetricEncryptedPrivateKeys is provided, they will be decrypted symmetricOptions and password (in the authToken)
 *  Returns: One or more signatures - one for each privateKey provided
 */
export async function signResolver(params: SignParams, context: Context, appId: AppId): Promise<string[]> {
  assertValidChainType(params?.chainType)
  const {
    asymmetricEncryptedPrivateKeys,
    authToken,
    chainType,
    payloadToSign,
    symmetricEncryptedPrivateKeys,
    symmetricOptions,
  } = params
  const chainConnect = await getChain(chainType, context, appId)
  const { chain } = chainConnect
  const { logger } = context
  let privateKeys: PrivateKey[]
  let signatures: string[]

  const { symmetricEccOptions, symmetricEd25519Options } = mapSymmetricOptionsParam(symmetricOptions)
  // decrypt private keys (aaymmetrically encrypted) - must have access to private key(s)
  const { password } = getInfoFromAuthToken(authToken)

  try {
    // decrypt private keys (symmetrically encrypted)
    await Promise.all(
      (symmetricEncryptedPrivateKeys || []).map(async encPrivKey => {
        const privateKey = await decryptSymmetrically(chainConnect, {
          encrypted: encPrivKey,
          password,
          options: symmetricEccOptions || symmetricEd25519Options,
        })
        privateKeys.push(privateKey)
      }),
    )

    // decrypt private keys (asymmetrically encrypted)
    // currently only works if all of asymmetricEncryptedPrivateKeys are only encrypted with BASE_PUBLIC_KEY
    await Promise.all(
      (asymmetricEncryptedPrivateKeys || []).map(async encPrivKey => {
        privateKeys = await getPrivateKeysForAsymEncryptedPayload(encPrivKey)
        const privateKey = await decryptAsymmetrically(chainConnect, {
          encrypted: encPrivKey,
          privateKeys,
        })
        privateKeys.push(privateKey)
      }),
    )

    // generate a signature for each privateKey
    await Promise.all(
      privateKeys.map(async pk => {
        const signature = await chain.sign(payloadToSign, pk, DEFAULT_SIGNATURE_ENCODING)
        signatures.push(signature)
      }),
    )
  } catch (error) {
    const errorMessage = 'Problem encrypting key (or string)'
    logger.logAndThrowError(errorMessage, error)
  }

  return signatures
}

/** Retrieve PrivateKeys needed to decrypt AsymmetricEncryptedString
 *  Keys must be available to the service or it will throw an error currently only works with BASE_PUBLIC_KEY
 */
export async function getPrivateKeysForAsymEncryptedPayload(
  encryptedKey: AsymmetricEncryptedString,
): Promise<PrivateKey[]> {
  const privateKeys: PrivateKey[] = []
  // convert encryptedKey to object
  const encryptedObject = JSON.parse(encryptedKey)
  if (!Array.isArray(encryptedObject) || isNullOrEmpty(encryptedObject)) {
    throwNewError(
      `encryptedKey must be an not array of type AsymmetricEncryptedString - got ${JSON.stringify(encryptedKey)}`,
    )
  }

  // sort encrypted items - in REVERSE order of seq
  const blobsReversed = (encryptedObject as AsymmetricEncryptedItem[]).sort((a, b) => (a.seq < b.seq ? 1 : -1)) // reverse sort by seq number
  // loop through items in REVERSE order of encryption
  await asyncForEach(blobsReversed, async (encryptedItem: AsymmetricEncryptedItem) => {
    const privateKey = await retrievePrivateKeyForPublicKey(encryptedItem.publicKey)
    privateKeys.push(privateKey)
  })

  return privateKeys
}

/** Retrieves a private key from locally held keys - or throw if key unavailable */
export async function retrievePrivateKeyForPublicKey(publicKey: PublicKey): Promise<PrivateKey> {
  // currently we only have one private key
  if (publicKey === BASE_PUBLIC_KEY) return BASE_PRIVATE_KEY
  // No matching publicKey
  throwNewError(`Could not retrieve PrivateKey for PublicKey: ${publicKey}. Service does not have access to it.`)
  return null
}

/** Verify AUthToken anbd Extract details from it */
export function getInfoFromAuthToken(authToken: AuthToken) {
  // TODO: handle authToken to extract password
  const password = 'mypassword'
  return {
    password,
  }
}

/** lookup the salt secret string using a well-known (pre-registered) name */
export function mapSaltNameToSalt(saltName: string) {
  // TODO: handle get salt from params?.symmetricOptions?.saltName
  if (!saltName) {
    return ''
  }
  return 'todo-lookup-salt'
}

/** Map incoming params to ModelsCryptoAsymmetric.EciesOptions */
export function mapAsymmetricOptionsParam(asymmetricOptionsFromParams: AsymmetricOptions) {
  const { iv, s1, s2 } = asymmetricOptionsFromParams
  const options: AsymmetricEncryptionOptions = {}
  if (iv) options.iv = iv
  if (s1) options.s1 = s1
  if (s2) options.s2 = s2
  return options
}

/** Map incoming params to SymmetricEccOptions an/or SymmetricEd25519Options */
export function mapSymmetricOptionsParam(symmetricOptionsFromParams: SymmetricEccOptions | SymmetricEd25519Options) {
  const symmetricEccOptions: SymmetricEccOptions = {}
  const symmetricEd25519Options: SymmetricEd25519Options = {}
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
  if (!isNullOrEmpty(symmetricEccOptions)) {
    return { symmetricEccOptions, isEcc: true, isEd25519: false }
  }
  if (!isNullOrEmpty(symmetricEd25519Options)) {
    return { symmetricEd25519Options, isEcc: false, isEd25519: true }
  }

  // we should not get here - nothing to return
  return { symmetricEd25519Options: null, isEcc: false, isEd25519: false }
}

/** Encrypts a string asymmetrically - using one or more publicKeys */
export async function encryptAsymmetrically(
  chainConnect: ChainConnection,
  params: EncryptAsymmetricallyParams,
): Promise<AsymmetricEncryptedString> {
  const { chain } = chainConnect
  return chain.encryptWithPublicKeys(params?.unencrypted, params?.publicKeys, params?.options)
}

/** Encrypts a string symmetrically - using a password and optional salt */
export async function encryptSymmetrically(
  chainConnect: ChainConnection,
  params: EncryptSymmetricallyParams,
): Promise<SymmetricEncryptedString> {
  const { chain } = chainConnect
  return chain.encryptWithPassword(params?.unencrypted, params?.password, params?.options)
}

/** Decrypts a symmetrically encrypted payload - using a password and optional salt */
export async function decryptSymmetrically(
  chainConnect: ChainConnection,
  params: DecryptSymmetricallyParams,
): Promise<string> {
  const { chain } = chainConnect
  return chain.decryptWithPassword(params?.encrypted, params?.password, params?.options)
}

/** Decrypts an asymmetrically encrypted payload - using private keys and options */
export async function decryptAsymmetrically(
  chainConnect: ChainConnection,
  params: DecryptAsymmetricallyParams,
): Promise<string> {
  const { chain } = chainConnect
  return chain.decryptWithPrivateKeys(params?.encrypted, params?.privateKeys)
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
  symmetricEncryptedStrings: SymmetricEncryptedString[]
  asymmetricEncryptedStrings: AsymmetricEncryptedString[]
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
