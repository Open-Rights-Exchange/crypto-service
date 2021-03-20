import { NextFunction, Request, Response } from 'express'
import { globalLogger } from '../../../helpers/logger'
import { addAppIdToContextFromApiKey, createContext } from '../context'
import {
  assertBodyHasAtLeastOneOfValues,
  assertBodyHasOnlyOneOfValues,
  assertBodyhasRequiredValues,
  assertBodyValueIsArrayIfExists,
  assertHeaderhasRequiredValues,
  returnResponse,
  validateApiAuthToken,
  validateEncryptedPayloadAuthToken,
  validatePasswordAuthToken,
} from '../helpers'
import { Config, Context, ErrorSeverity, ErrorType, HttpStatusCode } from '../../../models'
import {
  decryptWithPasswordResolver,
  decryptWithPrivateKeysResolver,
  encryptResolver,
  generateKeysResolver,
  getTransitPublicKeyResolver,
  recoverAndReencryptResolver,
  signResolver,
  verifyPublicKeyResolver,
} from '../../resolvers/crypto'
import { logError, ServiceError } from '../../../helpers/errors'
import { StateStore } from '../../../helpers/stateStore'

// Root-level routes
async function v1Root(req: Request, res: Response, next: NextFunction, config: Config, state: StateStore) {
  const now = new Date()
  const { action } = req.params
  const context = createContext(req, config, now)
  try {
    await addAppIdToContextFromApiKey(req, context)
  } catch (error) {
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, null, error)
  }
  switch (action) {
    case 'decrypt-with-password':
      return handleDecryptWithPassword(req, res, next, context)
    case 'decrypt-with-private-keys':
      return handleDecryptWithPrivateKeys(req, res, next, context)
    case 'encrypt':
      return handleEncrypt(req, res, next, context)
    case 'generate-keys':
      return handleGenerateKeys(req, res, next, context)
    case 'get-transit-key':
      return handleGetTransitKey(req, res, next, context, state)
    case 'verify-public-key':
      return handleVerifyPublicKey(req, res, next, context)
    case 'recover-and-reencrypt':
      return handleRecoverAndReencrypt(req, res, next, context)
    case 'sign':
      return handleSign(req, res, next, context)
    default:
      return returnResponse(req, res, HttpStatusCode.NOT_FOUND_404, { errorMessage: 'Not a valid endpoint' }, context)
  }
}
// api/decrypt-with-password
/** Calls resolver to decrypt the payload using provided password and options */
export async function handleDecryptWithPassword(req: Request, res: Response, next: NextFunction, context: Context) {
  const funcName = 'api/decrypt-with-password'
  try {
    globalLogger.trace('called handleDecryptWithPassword')
    assertHeaderhasRequiredValues(req, ['api-key', 'auth-token'], funcName)
    assertBodyhasRequiredValues(req, ['chainType', 'encrypted', 'symmetricOptions'], funcName)
    assertBodyValueIsArrayIfExists(req, ['returnAsymmetricOptions'], funcName)
    const { chainType, encrypted, returnAsymmetricOptions, symmetricOptions } = req.body
    await validateApiAuthToken(req, context)
    const passwordAuthToken = symmetricOptions
      ? await validatePasswordAuthToken(req, symmetricOptions, encrypted, context)
      : null
    const password = passwordAuthToken?.secrets?.password
    const response = await decryptWithPasswordResolver(
      { chainType, encrypted, password, symmetricOptions, returnAsymmetricOptions },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/decrypt-with-private-keys
/** Calls resolver to decrypt the payload using provided password and options */
export async function handleDecryptWithPrivateKeys(req: Request, res: Response, next: NextFunction, context: Context) {
  const funcName = 'api/decrypt-with-private-keys'
  let asymmetricEncryptedPrivateKeys
  try {
    globalLogger.trace('called handleDecryptWithPrivateKeys')
    assertHeaderhasRequiredValues(req, ['api-key', 'auth-token'], funcName)
    assertBodyhasRequiredValues(req, ['chainType', 'encrypted'], funcName)
    assertBodyHasOnlyOneOfValues(
      req,
      ['asymmetricEncryptedPrivateKeysAndAuthToken', 'symmetricEncryptedPrivateKeys'],
      funcName,
    )
    assertBodyValueIsArrayIfExists(req, ['returnAsymmetricOptions'], funcName)
    const {
      chainType,
      encrypted,
      asymmetricEncryptedPrivateKeysAndAuthToken,
      symmetricEncryptedPrivateKeys,
      symmetricOptionsForEncryptedPrivateKeys,
      returnAsymmetricOptions,
    } = req.body

    await validateApiAuthToken(req, context)
    const passwordAuthToken = symmetricEncryptedPrivateKeys
      ? await validatePasswordAuthToken(req, symmetricOptionsForEncryptedPrivateKeys, encrypted, context)
      : null
    const password = passwordAuthToken?.secrets?.password

    // extract asymmetricEncryptedPrivateKeys and validate its authToken
    const encryptedKeysAuthToken = await validateEncryptedPayloadAuthToken(
      req,
      asymmetricEncryptedPrivateKeysAndAuthToken,
      'asymmetricEncryptedPrivateKeysAndAuthToken',
      context,
    )
    asymmetricEncryptedPrivateKeys = encryptedKeysAuthToken?.encrypted

    const response = await decryptWithPrivateKeysResolver(
      {
        chainType,
        encrypted,
        asymmetricEncryptedPrivateKeys,
        symmetricEncryptedPrivateKeys,
        symmetricOptionsForEncryptedPrivateKeys,
        returnAsymmetricOptions,
        password,
      },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/recover-and-reencrypt
/** Calls resolver to decrypt the payload using provided password and options */
export async function handleRecoverAndReencrypt(req: Request, res: Response, next: NextFunction, context: Context) {
  const funcName = 'api/recover-and-reencrypt'
  let encryptedPayload
  let asymmetricEncryptedPrivateKeys
  let password
  try {
    globalLogger.trace('called handleRecoverAndReencrypt')
    assertHeaderhasRequiredValues(req, ['api-key', 'auth-token'], funcName)
    assertBodyhasRequiredValues(req, ['chainType', 'asymmetricEncryptedPrivateKeysAndAuthToken'], funcName)
    assertBodyHasOnlyOneOfValues(req, ['encrypted', 'encryptedAndAuthToken'], funcName)
    assertBodyHasAtLeastOneOfValues(req, ['symmetricOptionsForReencrypt', 'asymmetricOptionsForReencrypt'], funcName)
    assertBodyValueIsArrayIfExists(req, ['asymmetricOptionsForReencrypt'], funcName)

    const {
      chainType,
      encrypted,
      encryptedAndAuthToken,
      asymmetricEncryptedPrivateKeysAndAuthToken,
      symmetricOptionsForReencrypt,
      asymmetricOptionsForReencrypt,
    } = req.body

    await validateApiAuthToken(req, context)

    // extract encrypted payload from encryptedAndAuthToken (if provided) and validate authToken
    if (encryptedAndAuthToken) {
      const encryptedPayloadAuthToken = await validateEncryptedPayloadAuthToken(
        req,
        encryptedAndAuthToken,
        'encryptedAndAuthToken',
        context,
      )
      encryptedPayload = encryptedPayloadAuthToken?.encrypted
    } else {
      encryptedPayload = encrypted
    }

    // validate passwordAuthToken and extract password (if provided in sym options)
    if (symmetricOptionsForReencrypt) {
      const passwordAuthToken = await validatePasswordAuthToken(
        req,
        symmetricOptionsForReencrypt,
        encryptedPayload,
        context,
      )
      password = passwordAuthToken?.secrets?.password
    }

    // extract asymmetricEncryptedPrivateKeys and validate authToken
    const encryptedKeysAuthToken = await validateEncryptedPayloadAuthToken(
      req,
      asymmetricEncryptedPrivateKeysAndAuthToken,
      'asymmetricEncryptedPrivateKeysAndAuthToken',
      context,
    )
    asymmetricEncryptedPrivateKeys = encryptedKeysAuthToken?.encrypted

    const response = await recoverAndReencryptResolver(
      {
        chainType,
        encrypted: encryptedPayload,
        asymmetricEncryptedPrivateKeys,
        symmetricOptionsForReencrypt,
        asymmetricOptionsForReencrypt,
        password,
      },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/encrypt
/** Calls resolver to encrypt the payload using one or more public/private key pairs for a specific blockchain */
export async function handleEncrypt(req: Request, res: Response, next: NextFunction, context: Context) {
  const funcName = 'api/encrypt'
  try {
    globalLogger.trace('called handleEncrypt')
    assertHeaderhasRequiredValues(req, ['api-key', 'auth-token'], funcName)
    assertBodyhasRequiredValues(req, ['chainType', 'toEncrypt'], funcName)
    assertBodyHasAtLeastOneOfValues(req, ['asymmetricOptions', 'symmetricOptions'], funcName)
    assertBodyValueIsArrayIfExists(req, ['asymmetricOptions'], funcName)
    const { asymmetricOptions, chainType, toEncrypt, symmetricOptions } = req.body

    await validateApiAuthToken(req, context)
    const passwordAuthToken = symmetricOptions
      ? await validatePasswordAuthToken(req, symmetricOptions, toEncrypt, context)
      : null
    const password = passwordAuthToken?.secrets?.password
    const response = await encryptResolver(
      { chainType, asymmetricOptions, symmetricOptions, password, toEncrypt },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/generate-keys
/** Calls resolver to generate one or more public/private key pairs for a specific blockchain */
export async function handleGenerateKeys(req: Request, res: Response, next: NextFunction, context: Context) {
  const funcName = 'api/generate-keys'
  try {
    globalLogger.trace('called handleGenerateKeys')
    assertHeaderhasRequiredValues(req, ['api-key', 'auth-token'], funcName)
    assertBodyhasRequiredValues(req, ['chainType'], funcName)
    assertBodyHasAtLeastOneOfValues(req, ['asymmetricOptions', 'symmetricOptions'], funcName)
    assertBodyValueIsArrayIfExists(req, ['asymmetricOptions'], funcName)
    const { asymmetricOptions, chainType, keyCount, symmetricOptions } = req.body

    await validateApiAuthToken(req, context)
    const passwordAuthToken = symmetricOptions
      ? await validatePasswordAuthToken(req, symmetricOptions, null, context)
      : null
    const password = passwordAuthToken?.secrets?.password
    const response = await generateKeysResolver(
      { chainType, keyCount, asymmetricOptions, symmetricOptions, password },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/sign
/** Calls resolver to sign a transaction with one or more private key pairs for a specific blockchain */
export async function handleSign(req: Request, res: Response, next: NextFunction, context: Context) {
  const funcName = 'api/sign'
  let asymmetricEncryptedPrivateKeys
  try {
    globalLogger.trace('called handleSign')
    assertHeaderhasRequiredValues(req, ['api-key', 'auth-token'], funcName)
    assertBodyhasRequiredValues(req, ['chainType', 'toSign'], funcName)
    assertBodyHasAtLeastOneOfValues(
      req,
      ['asymmetricEncryptedPrivateKeysAndAuthToken', 'symmetricEncryptedPrivateKeys'],
      funcName,
    )
    assertBodyValueIsArrayIfExists(req, ['symmetricEncryptedPrivateKeys'], funcName)
    const {
      chainType,
      toSign,
      symmetricOptions,
      asymmetricEncryptedPrivateKeysAndAuthToken,
      symmetricEncryptedPrivateKeys,
    } = req.body

    await validateApiAuthToken(req, context)
    const passwordAuthToken = symmetricOptions
      ? await validatePasswordAuthToken(req, symmetricOptions, toSign, context)
      : null
    const password = passwordAuthToken?.secrets?.password

    // extract asymmetricEncryptedPrivateKeys and validate its authToken
    const encryptedKeysAuthToken = await validateEncryptedPayloadAuthToken(
      req,
      asymmetricEncryptedPrivateKeysAndAuthToken,
      'asymmetricEncryptedPrivateKeysAndAuthToken',
      context,
    )
    asymmetricEncryptedPrivateKeys = encryptedKeysAuthToken?.encrypted

    if (asymmetricEncryptedPrivateKeysAndAuthToken && !Array.isArray(asymmetricEncryptedPrivateKeys)) {
      const msg = `Bad parameter(s) in request body. 'encrypted' param (within asymmetricEncryptedPrivateKeysAndAuthToken) must be an array. If only one value, enclose it in an array i.e. [ ].`
      throw new ServiceError(msg, ErrorType.BadParam, funcName)
    }

    const response = await signResolver(
      {
        chainType,
        password,
        toSign,
        symmetricOptions,
        asymmetricEncryptedPrivateKeys,
        symmetricEncryptedPrivateKeys,
      },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/get-transit-key
/** Returns a single use public key for caller to use to (asymmetrically) encrypt all data sent to this server */
export async function handleGetTransitKey(req: Request, res: Response, next: NextFunction, context: Context, state: StateStore) {
  const funcName = 'api/get-transit-key'
  try {
    globalLogger.trace('called handleGetTransitKey')
    assertBodyhasRequiredValues(req, ['nonce'], funcName)
    assertHeaderhasRequiredValues(req, ['api-key'], funcName)
    const { nonce } = req.body
    const response = await getTransitPublicKeyResolver({ nonce }, context, state)
    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/public-key
/** Returns the public key for which all incoming secrets should be asymmetrically encrypted */
export async function handleVerifyPublicKey(req: Request, res: Response, next: NextFunction, context: Context) {
  const funcName = 'api/verify-public-key'
  try {
    globalLogger.trace('called handlePublicKey')
    assertBodyhasRequiredValues(req, ['nonce'], funcName)
    assertHeaderhasRequiredValues(req, ['api-key'], funcName)
    const { nonce } = req.body
    const response = await verifyPublicKeyResolver({ nonce }, context)
    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

export { v1Root }
