import { BASE_PUBLIC_KEY, BASE_PRIVATE_KEY } from '../../constants'
import {
  AppConfigType,
  Asymmetric,
  AsymmetricEncryptedData,
  AsymmetricEncryptedString,
  AsymmetricEncryptionOptions,
  AsymmetricOptions,
  ChainType,
  Context,
  DecryptAsymmetricallyParams,
  DecryptPrivateKeysParams,
  DecryptSymmetricallyParams,
  EncryptAsymmetricallyParams,
  EncryptSymmetricallyParams,
  ErrorType,
  PrivateKey,
  PublicKey,
  SymmetricEccOptions,
  SymmetricEd25519Options,
  SymmetricEncryptedData,
  SymmetricEncryptedString,
} from '../../../models'
import { ChainConnection, getChain } from '../../chains/chainConnection'
import {
  ensureArray,
  asyncForEach,
  isNullOrEmpty,
  convertStringifiedJsonOrObjectToObject,
  convertObjectToStringifiedJson,
  ServiceError,
} from '../../../helpers'
import { getAppConfig } from '../appConfig'

export type EncryptReturnValueParams = {
  /** chain/curve used to encrypt */
  chainConnect: ChainConnection
  /** Stringified JSON of encrypted payload - value to decrypt */
  unencrypted: string
  /** (optional) options to re-encrypt result before returning it */
  returnAsymmetricOptions?: AsymmetricOptions
}

/** Optionally encrypt value before returning it using returnAsymmetricOptions */
export async function optionallyEncryptReturnValue(params: EncryptReturnValueParams) {
  const { chainConnect, unencrypted, returnAsymmetricOptions } = params
  let asymmetricEncryptedString: AsymmetricEncryptedString
  let decryptedResult = unencrypted
  if (returnAsymmetricOptions?.publicKeys) {
    const options = mapAsymmetricOptionsParam(returnAsymmetricOptions)
    asymmetricEncryptedString = await encryptAsymmetrically(chainConnect, {
      unencrypted,
      publicKeys: returnAsymmetricOptions?.publicKeys,
      ...options,
    })
    // dont return result in the clear if we have an encryptedResult
    decryptedResult = null
  }
  return { decryptedResult, asymmetricEncryptedString }
}

/** Decrypt private keys and return array
 *  keys can be encrypted sym or asym or both
 */
export async function decryptPrivateKeys(params: DecryptPrivateKeysParams): Promise<PrivateKey[]> {
  const { symmetricOptions = {}, password, chainConnect } = params
  const { chainFunctions, context } = chainConnect
  const chainType = getChainTypeFromChain(chainConnect)
  const privateKeys: PrivateKey[] = []

  const symmetricEncryptedPrivateKeys: SymmetricEncryptedString[] =
    ensureEncryptedSymIsArrayObject(chainConnect, params?.symmetricEncryptedPrivateKeys) || []
  const asymmetricEncryptedPrivateKeys: AsymmetricEncryptedString[] =
    ensureEncryptedAsymIsArrayObject(chainConnect, params?.asymmetricEncryptedPrivateKeys) || []

  // decrypt symmetrically encrypted private keys
  if (!isNullOrEmpty(symmetricEncryptedPrivateKeys)) {
    const { symmetricEccOptions, symmetricEd25519Options } = await mapSymmetricOptionsParam(symmetricOptions, context)
    await Promise.all(
      symmetricEncryptedPrivateKeys.map(async encPrivKey => {
        const privateKey = await decryptSymmetrically(chainConnect, {
          encrypted: encPrivKey,
          password,
          options: symmetricEccOptions || symmetricEd25519Options,
        })
        assertValidPrivateKeys(chainConnect, [privateKey], 'decryptPrivateKeys')
        privateKeys.push(privateKey)
      }),
    )
  }

  // decrypt asymmetrically encrypted private keys
  // currently only works if all of asymmetricEncryptedPrivateKeys are only encrypted with BASE_PUBLIC_KEY
  if (!isNullOrEmpty(asymmetricEncryptedPrivateKeys)) {
    await Promise.all(
      asymmetricEncryptedPrivateKeys.map(async encPrivKey => {
        const privateKeysToDecryptWith = await getPrivateKeysForAsymEncryptedPayload(chainType, encPrivKey)
        const encPrivKeyStr = JSON.stringify(encPrivKey)

        const privateKey = await decryptAsymmetrically(chainConnect, {
          encrypted: encPrivKey,
          privateKeys: privateKeysToDecryptWith,
        })
        assertValidPrivateKeys(chainConnect, [privateKey], 'decryptPrivateKeys')
        privateKeys.push(privateKey)
      }),
    )
  }

  if (isNullOrEmpty(privateKeys)) {
    const msg = `Couldn't successfully decrypt any private keys to use. Chain: ${chainType}.`
    throw new ServiceError(msg, ErrorType.KeyError, 'decryptPrivateKeys')
  }

  return privateKeys
}

/** Confirm that all private keys are valid for the chain type
 *  Exempts check for base private key */
export function assertValidPrivateKeys(chainConnect: ChainConnection, privateKeys: PrivateKey[], funcName: string) {
  privateKeys.forEach(pk => {
    if (pk !== BASE_PRIVATE_KEY && !chainConnect.chainFunctions.isValidPrivateKey(pk)) {
      const msg = `A value provided as encrypted private key is not a valid private key for chain: ${chainConnect.chainType}. Encrypted value: ${pk}`
      throw new ServiceError(msg, ErrorType.KeyError, funcName)
    }
  })
}

/** Retrieve PrivateKeys needed to decrypt AsymmetricEncryptedString
 *  Keys must be available to the service or it will throw an error - currently only works with BASE_PUBLIC_KEY
 *  chainType filters response to private keys for that chain (since each chain type can have a different key format)
 *  chainType = null means use uncompressed public key
 */
export async function getPrivateKeysForAsymEncryptedPayload(
  chainType: ChainType,
  encryptedKey: AsymmetricEncryptedString | AsymmetricEncryptedData | AsymmetricEncryptedData[],
): Promise<PrivateKey[]> {
  const privateKeys: PrivateKey[] = []
  // convert encryptedKey to object
  let encryptedObject = convertStringifiedJsonOrObjectToObject(encryptedKey)
  if (isNullOrEmpty(encryptedObject)) {
    const msg = `encryptedKey must be type AsymmetricEncryptedString (or array) - got ${JSON.stringify(encryptedKey)}`
    throw new ServiceError(msg, ErrorType.BadParam, 'getPrivateKeysForAsymEncryptedPayload')
  }
  // if we only have a single key, wrap it in array
  if (!Array.isArray(encryptedObject)) {
    encryptedObject = [encryptedObject]
  }

  // sort encrypted items - in REVERSE order of seq
  const blobsReversed = (encryptedObject as AsymmetricEncryptedData[]).sort((a, b) => (a.seq < b.seq ? 1 : -1)) // reverse sort by seq number
  // loop through items in REVERSE order of encryption
  await asyncForEach(blobsReversed, async (encryptedItem: AsymmetricEncryptedData) => {
    const { chainType: chainTypeForKey, privateKey } = await retrievePrivateKeyForPublicKey(encryptedItem.publicKey)
    // only return keys for the specific chain - since formatting of the key is diff for each chain
    if (chainTypeForKey === null || chainTypeForKey === chainType) {
      privateKeys.push(privateKey)
    }
  })
  if (isNullOrEmpty(privateKeys)) {
    const encPrivKeyStr = JSON.stringify(encryptedKey)
    const msg = `Don't have private keys to decrypt a value in asymmetricEncryptedPrivateKeys for chainType ${chainType}. Did you mean to use the service's key? Encrypted value: ${encPrivKeyStr}`
    throw new ServiceError(msg, ErrorType.KeyError, 'decryptPrivateKeys')
  }
  return privateKeys
}

/** Retrieves a private key from locally held keys - or throw if key unavailable */
export async function retrievePrivateKeyForPublicKey(
  publicKey: PublicKey,
): Promise<{ chainType: ChainType; privateKey: PrivateKey }> {
  // currently, we only have one private key
  if (publicKey === BASE_PUBLIC_KEY) {
    return { chainType: null, privateKey: BASE_PRIVATE_KEY }
  }
  // No matching publicKey
  const msg = `Could not retrieve PrivateKey for PublicKey: ${publicKey}. Service does not have access to it.`
  throw new ServiceError(msg, ErrorType.KeyError, 'retrievePrivateKeyForPublicKey')
}

export type DecryptWithBasePrivateKeyParams = {
  encrypted: AsymmetricEncryptedString | AsymmetricEncryptedData | AsymmetricEncryptedData[]
}

/** Asymmetrically decrypts an encrypted value using a key pair (public/private) managed by this service (i.e this service has the private key)
 *  Currently, only the BASE_PUBLIC_KEY and BASE_PRIVATE_KEY key pair is managed/known by this service
 *  The BASE_PUBLIC_KEY must be in an uncompressed format - not in a chain-specific format like eth, eos, etc.
 */
export async function decryptWithBasePrivateKey(params: DecryptWithBasePrivateKeyParams) {
  const { encrypted } = params
  assertIsValidAsymEncrypted(encrypted)
  // decrypt payload asymmetrically - assumes using BASE_PUBLIC_KEY - which is an uncompressed public key
  const encryptedObject = convertStringifiedJsonOrObjectToObject(encrypted)
  const [privateKey] = await getPrivateKeysForAsymEncryptedPayload(null, encryptedObject)
  const decrypted = Asymmetric.decryptWithPrivateKey(encryptedObject, privateKey)
  return decrypted
}

export type MapSaltNameToSaltParams = {
  saltName: string
}

/** lookup the salt secret string using a well-known (pre-registered) name */
export async function mapSaltNameToSalt({ saltName }: MapSaltNameToSaltParams, context: Context): Promise<string> {
  // Lookup salt from app configuration
  const salt = await getAppConfig({ type: AppConfigType.Salt, name: saltName }, context)
  return salt
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
export async function mapSymmetricOptionsParam(
  symmetricOptionsFromParams: SymmetricEccOptions | SymmetricEd25519Options = {},
  context: Context,
): Promise<{
  symmetricEccOptions?: SymmetricEccOptions
  symmetricEd25519Options?: SymmetricEd25519Options
  isEcc: boolean
  isEd25519: boolean
}> {
  const symmetricEccOptions: SymmetricEccOptions = {}
  const symmetricEd25519Options: SymmetricEd25519Options = {}
  // handle ECC
  {
    const { iter, saltName, salt } = symmetricOptionsFromParams as SymmetricEccOptions
    if (iter) symmetricEccOptions.iter = iter
    if (salt) {
      symmetricEccOptions.salt = salt
    } else if (saltName) {
      symmetricEccOptions.salt = await mapSaltNameToSalt({ saltName }, context)
    }
  }
  // handle Ed25519
  {
    const { N, saltName, salt } = symmetricOptionsFromParams as SymmetricEd25519Options
    if (N) symmetricEd25519Options.N = N
    if (salt) {
      symmetricEd25519Options.salt = salt
    } else if (saltName) {
      symmetricEd25519Options.salt = await mapSaltNameToSalt({ saltName }, context)
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
  return { symmetricEccOptions: null, isEcc: false, isEd25519: false }
}

/** Throw if value is not a valid asymmetric payload
 *  If no chainConnect is provided, uses the generic Asymmetric test */
export function assertIsValidAsymEncrypted(encrypted: any, chainConnect?: ChainConnection) {
  const { chainFunctions } = chainConnect || {}
  let isValid
  // TODO: Consider checking that all public keys are valid for chain type
  // convert to string if an object
  const encryptedString = convertObjectToStringifiedJson(encrypted)
  if (chainFunctions) {
    isValid = chainFunctions.isAsymEncryptedDataString(encryptedString)
  } else {
    isValid = Asymmetric.isAsymEncryptedDataString(encryptedString)
  }
  if (!isValid) {
    const msg = `Invalid value provided as asymmetrically encrypted item.`
    throw new ServiceError(msg, ErrorType.KeyError, 'assertIsValidAsymEncrypted')
  }
}

/** Encrypts a string asymmetrically - using one or more publicKeys */
export async function encryptAsymmetrically(
  chainConnect: ChainConnection,
  params: EncryptAsymmetricallyParams,
): Promise<AsymmetricEncryptedString> {
  const { options, publicKeys, unencrypted } = params
  let { chainFunctions } = chainConnect
  // if we are encrypting only using the base public key, we use the 'NoChain' functions instead
  if (!isNullOrEmpty(publicKeys) && publicKeys[0] === BASE_PUBLIC_KEY) {
    const chainConnectNoChain = await getChain(ChainType.NoChain, null)
    chainFunctions = chainConnectNoChain.chainFunctions
  }
  return chainFunctions.encryptWithPublicKeys(unencrypted, publicKeys, options)
}

/** Encrypts a string symmetrically - using a password and optional salt */
export async function encryptSymmetrically(
  chainConnect: ChainConnection,
  params: EncryptSymmetricallyParams,
): Promise<SymmetricEncryptedString> {
  const { chainFunctions } = chainConnect
  return chainFunctions.encryptWithPassword(params?.unencrypted, params?.password, params?.options)
}

/** Decrypts a symmetrically encrypted payload - using a password and optional salt */
export async function decryptSymmetrically(
  chainConnect: ChainConnection,
  params: DecryptSymmetricallyParams,
): Promise<string> {
  const { chainFunctions } = chainConnect
  // convert from object to string if needed
  const valueToDecrypt = convertObjectToStringifiedJson(params?.encrypted)
  const encryptedString = chainFunctions.toSymEncryptedDataString(valueToDecrypt)
  return chainFunctions.decryptWithPassword(encryptedString, params?.password, params?.options)
}

/** Decrypts an asymmetrically encrypted payload - using private keys and options */
export async function decryptAsymmetrically(
  chainConnect: ChainConnection,
  params: DecryptAsymmetricallyParams,
): Promise<string> {
  const { encrypted, privateKeys } = params
  let { chainFunctions } = chainConnect
  // if we are decrypting only using the base private key, we use the 'NoChain' functions instead
  if (!isNullOrEmpty(privateKeys) && privateKeys[0] === BASE_PRIVATE_KEY) {
    const chainConnectNoChain = await getChain(ChainType.NoChain, null)
    chainFunctions = chainConnectNoChain.chainFunctions
  }
  // wrap encrypted value in an array if not already
  const encryptedArray = ensureEncryptedAsymIsArrayObject(chainConnect, encrypted) || []
  // convert from object to string if needed
  const valueToDecrypt = convertObjectToStringifiedJson(encryptedArray)
  assertIsValidAsymEncrypted(valueToDecrypt, chainConnect)
  const encryptedString = chainFunctions.toAsymEncryptedDataString(valueToDecrypt)
  return chainFunctions.decryptWithPrivateKeys(encryptedString, privateKeys)
}

export function getChainTypeFromChain(chainConnect: ChainConnection) {
  const { chainFunctions } = chainConnect
  return chainFunctions.chainType
}

/** Make sure that an asym encrypted object or string is wrapped in an array
 *  Returns a AsymmetricEncryptedItem[] (array of items) */
export function ensureEncryptedAsymIsArrayObject(
  chainConnect: ChainConnection,
  encrypted:
    | AsymmetricEncryptedString
    | AsymmetricEncryptedString[]
    | AsymmetricEncryptedData
    | AsymmetricEncryptedData[],
): AsymmetricEncryptedString[] {
  if (!encrypted) return null
  const { chainFunctions } = chainConnect
  let valueToReturn: AsymmetricEncryptedString[]
  const possibleObject = convertStringifiedJsonOrObjectToObject(encrypted, true)
  // if encrypted is not a stringified object, wrap value (e.g. a string) in an array and return it
  if (!possibleObject) {
    valueToReturn = [chainFunctions.toAsymEncryptedDataString(encrypted)]
  } else {
    valueToReturn = ensureArray(possibleObject)
  }
  return valueToReturn
}

/** Make sure that a symmetrically encrypted object or string is wrapped in an array
 *  Returns a SymmetricEncryptedItem[] (array of items) */
export function ensureEncryptedSymIsArrayObject(
  chainConnect: ChainConnection,
  encrypted: SymmetricEncryptedString | SymmetricEncryptedData[] | SymmetricEncryptedData,
) {
  if (!encrypted) return null
  const { chainFunctions } = chainConnect
  let valueToReturn: SymmetricEncryptedString[]
  const possibleObject = convertStringifiedJsonOrObjectToObject(encrypted, true)
  // if encrypted is not a stringified object, wrap value (e.g. a string) in an array and return it
  if (!possibleObject) {
    valueToReturn = [chainFunctions.toSymEncryptedDataString(encrypted)]
  } else {
    valueToReturn = ensureArray(possibleObject)
  }
  return valueToReturn
}
