import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { logger as globalLogger } from '../../../helpers/logger'
import {
  checkBodyForAtLeastOneOfValues,
  checkBodyForOnlyOneOfValues,
  checkBodyForRequiredValues,
  checkHeaderForRequiredValues,
  getAppIdAndContextFromApiKey,
  returnResponse,
  validateApiAuthToken,
  validateEncryptedPayloadAuthToken,
  validatePasswordAuthToken,
} from '../helpers'
import { ErrorSeverity, ErrorType, HttpStatusCode } from '../../../models'
import { BASE_PUBLIC_KEY } from '../../constants'
import {
  decryptWithPasswordResolver,
  decryptWithPrivateKeysResolver,
  encryptResolver,
  generateKeysResolver,
  recoverAndReencryptResolver,
  signResolver,
  verifyPublicKeyResolver,
} from '../../resolvers/crypto'
import { logError, ServiceError } from '../../../helpers/errors'

dotenv.config()

// Root-level routes
async function v1Root(req: Request, res: Response, next: NextFunction) {
  const { action } = req.params
  switch (action) {
    case 'decrypt-with-password':
      return handleDecryptWithPassword(req, res, next)
    case 'decrypt-with-private-keys':
      return handleDecryptWithPrivateKeys(req, res, next)
    case 'encrypt':
      return handleEncrypt(req, res, next)
    case 'generate-keys':
      return handleGenerateKeys(req, res, next)
    case 'verify-public-key':
      return handleVerifyPublicKey(req, res, next)
    case 'recover-and-reencrypt':
      return handleRecoverAndReencrypt(req, res, next)
    case 'sign':
      return handleSign(req, res, next)
    default:
      return returnResponse(req, res, HttpStatusCode.NOT_FOUND_404, { errorMessage: 'Not a valid endpoint' }, null)
  }
}
// api/decrypt-with-password
/** Calls resolver to decrypt the payload using provided password and options */
export async function handleDecryptWithPassword(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/decrypt-with-password'
  let context
  try {
    globalLogger.trace('called handleDecryptWithPassword')
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    checkHeaderForRequiredValues(req, ['api-key', 'auth-token'], funcName)
    checkBodyForRequiredValues(req, ['chainType', 'encrypted', 'symmetricOptions'], funcName)
    const { chainType, encrypted, returnAsymmetricOptions, symmetricOptions } = req.body
    await validateApiAuthToken(req, context)
    const passwordAuthToken = await validatePasswordAuthToken(req, symmetricOptions, encrypted, context)
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
export async function handleDecryptWithPrivateKeys(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/decrypt-with-private-keys'
  let context
  let asymmetricEncryptedPrivateKeys
  try {
    globalLogger.trace('called handleDecryptWithPrivateKeys')
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    checkHeaderForRequiredValues(req, ['api-key', 'auth-token'], funcName)
    checkBodyForRequiredValues(req, ['chainType', 'encrypted'], funcName)
    checkBodyForOnlyOneOfValues(
      req,
      ['asymmetricEncryptedPrivateKeysAndAuthToken', 'symmetricEncryptedPrivateKeys'],
      funcName,
    )
    const {
      chainType,
      encrypted,
      asymmetricEncryptedPrivateKeysAndAuthToken,
      symmetricEncryptedPrivateKeys,
      symmetricOptionsForEncryptedPrivateKeys,
      returnAsymmetricOptions,
    } = req.body

    await validateApiAuthToken(req, context)
    const passwordAuthToken = await validatePasswordAuthToken(
      req,
      symmetricOptionsForEncryptedPrivateKeys,
      encrypted,
      context,
    )
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
export async function handleRecoverAndReencrypt(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/recover-and-reencrypt'
  let context
  let encryptedPayload
  let asymmetricEncryptedPrivateKeys
  let password
  try {
    globalLogger.trace('called handleRecoverAndReencrypt')
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    checkHeaderForRequiredValues(req, ['api-key', 'auth-token'], funcName)
    checkBodyForRequiredValues(req, ['chainType', 'asymmetricEncryptedPrivateKeysAndAuthToken'], funcName)
    checkBodyForOnlyOneOfValues(req, ['encrypted', 'encryptedAndAuthToken'], funcName)
    checkBodyForAtLeastOneOfValues(req, ['symmetricOptionsForReencrypt', 'asymmetricOptionsForReencrypt'], funcName)

    const {
      chainType,
      encrypted,
      encryptedAndAuthToken,
      asymmetricEncryptedPrivateKeysAndAuthToken,
      symmetricOptionsForReencrypt,
      asymmetricOptionsForReencrypt,
    } = req.body

    await validateApiAuthToken(req, context)
    // validate passwordAuthToken and extract password (if provided in sym options)
    if (symmetricOptionsForReencrypt) {
      const passwordAuthToken = await validatePasswordAuthToken(req, symmetricOptionsForReencrypt, encrypted, context)
      password = passwordAuthToken?.secrets?.password
    }

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
export async function handleEncrypt(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/encrypt'
  let context
  try {
    globalLogger.trace('called handleEncrypt')
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    checkHeaderForRequiredValues(req, ['api-key', 'auth-token'], funcName)
    checkBodyForRequiredValues(req, ['chainType', 'toEncrypt'], funcName)
    checkBodyForAtLeastOneOfValues(req, ['asymmetricOptions', 'symmetricOptions'], funcName)
    const { asymmetricOptions, chainType, toEncrypt, symmetricOptions } = req.body

    await validateApiAuthToken(req, context)
    const passwordAuthToken = await validatePasswordAuthToken(req, symmetricOptions, toEncrypt, context)
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
export async function handleGenerateKeys(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/generate-keys'
  let context
  try {
    globalLogger.trace('called handleGenerateKeys')
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    checkHeaderForRequiredValues(req, ['api-key', 'auth-token'], funcName)
    checkBodyForRequiredValues(req, ['chainType'], funcName)
    checkBodyForAtLeastOneOfValues(req, ['asymmetricOptions', 'symmetricOptions'], funcName)
    const { asymmetricOptions, chainType, keyCount, symmetricOptions } = req.body

    await validateApiAuthToken(req, context)
    const passwordAuthToken = await validatePasswordAuthToken(req, symmetricOptions, null, context)
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
export async function handleSign(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/sign'
  let context
  let asymmetricEncryptedPrivateKeys
  try {
    globalLogger.trace('called handleSign')
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    checkHeaderForRequiredValues(req, ['api-key', 'auth-token'], funcName)
    checkBodyForRequiredValues(req, ['chainType', 'toSign'], funcName)
    checkBodyForAtLeastOneOfValues(
      req,
      ['asymmetricEncryptedPrivateKeysAndAuthToken', 'symmetricEncryptedPrivateKeys'],
      funcName,
    )
    const {
      chainType,
      toSign,
      symmetricOptions,
      asymmetricEncryptedPrivateKeysAndAuthToken,
      symmetricEncryptedPrivateKeys,
    } = req.body

    await validateApiAuthToken(req, context)
    const passwordAuthToken = await validatePasswordAuthToken(req, symmetricOptions, toSign, context)
    const password = passwordAuthToken?.secrets?.password

    // extract asymmetricEncryptedPrivateKeys and validate its authToken
    const encryptedKeysAuthToken = await validateEncryptedPayloadAuthToken(
      req,
      asymmetricEncryptedPrivateKeysAndAuthToken,
      'asymmetricEncryptedPrivateKeysAndAuthToken',
      context,
    )
    asymmetricEncryptedPrivateKeys = encryptedKeysAuthToken?.encrypted

    if (
      (asymmetricEncryptedPrivateKeysAndAuthToken && !Array.isArray(asymmetricEncryptedPrivateKeys)) ||
      (symmetricEncryptedPrivateKeys && !Array.isArray(symmetricEncryptedPrivateKeys))
    ) {
      const msg = `Bad parameter(s) in request body. ...EncryptedPrivateKeys parameter(s) must be an array. If only have one value, enclose it in an array i.e. [ ].`
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

// api/public-key
/** Returns the public key for which all incoming secrets should be asymmetrically encrypted */
export async function handleVerifyPublicKey(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/public-key'
  let context
  try {
    globalLogger.trace('called handlePublicKey')
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    checkBodyForRequiredValues(req, ['nonce'], funcName)
    checkHeaderForRequiredValues(req, ['api-key'], funcName)
    const { nonce } = req.body
    const response = await verifyPublicKeyResolver({ nonce }, context)
    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Critical, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context)
  }
}

export { v1Root }
