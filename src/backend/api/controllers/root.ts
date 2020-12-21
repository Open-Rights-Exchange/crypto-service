import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { logger as globalLogger } from '../../utils/helpers'
import {
  returnResponse,
  getAppIdAndContextFromApiKey,
  checkForRequiredHeaderValues,
  checkForRequiredBodyValues,
} from '../helpers'
import { ErrorSeverity, ErrorType, HttpStatusCode } from '../../models'
import { BASE_PUBLIC_KEY } from '../../constants'
import {
  decryptWithPasswordResolver,
  encryptResolver,
  generateKeysResolver,
  signResolver,
} from '../../resolvers/crypto'
import { logError, ServiceError } from '../../resolvers/errors'
import { validateAuthTokenAndExtractContents } from '../../resolvers/token'

dotenv.config()

// Root-level routes
// TODO: remove /user route once lumeos and everipedia are no longer using it
async function v1Root(req: Request, res: Response, next: NextFunction) {
  const { action } = req.params
  switch (action) {
    case 'decrypt-with-password':
      return handleDecryptWithPassword(req, res, next)
    case 'encrypt':
      return handleEncrypt(req, res, next)
    case 'generate-keys':
      return handleGenerateKeys(req, res, next)
    case 'public-key':
      return handlePublicKey(req, res, next)
    case 'sign':
      return handleSign(req, res, next)
    default:
      return returnResponse(req, res, HttpStatusCode.NOT_FOUND_404, { errorMessage: 'Not a valid endpoint' }, null)
  }
}

// /api/decrypt-with-password
/** Calls resolver to decrypt the payload using provided password and options */
async function handleDecryptWithPassword(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/decrypt-with-password'
  let context
  try {
    globalLogger.trace('called handleDecryptWithPassword')
    checkForRequiredHeaderValues(req, ['api-key', 'auth-token'])
    checkForRequiredBodyValues(req, ['authToken', 'chainType', 'encryptedPayload', 'symmetricOptions'])
    const { chainType, encryptedPayload, returnAsymmetricOptions, symmetricOptions } = req.body
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    const authToken = await validateAuthTokenAndExtractContents(req, context)
    const password = authToken?.secrets?.password
    const response = await decryptWithPasswordResolver(
      { chainType, encryptedPayload, password, symmetricOptions, returnAsymmetricOptions },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// /api/encrypt
/** Calls resolver to encrypt the payload using one or more public/private key pairs for a specific blockchain */
async function handleEncrypt(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/encrypt'
  let context
  try {
    globalLogger.trace('called handleEncrypt')
    checkForRequiredHeaderValues(req, ['api-key', 'auth-token'])
    checkForRequiredBodyValues(req, ['chainType', 'payloadToEncrypt'])
    const { asymmetricOptions, chainType, payloadToEncrypt, symmetricOptions } = req.body

    // validate params
    if (!symmetricOptions && !asymmetricOptions) {
      const msg = `Missing required parameter(s) in request body. Must provide at least one of these parameters: asymmetricOptions, symmetricOptions`
      throw new ServiceError(msg, ErrorType.BadParam, funcName)
    }

    ;({ context } = await getAppIdAndContextFromApiKey(req))
    // const authToken = await assertValidAuthTokenAndExtractContents(req, context)
    const password = 'mypassword' // authToken?.secrets?.password
    const response = await encryptResolver(
      { chainType, asymmetricOptions, symmetricOptions, password, payloadToEncrypt },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// /api/generate-keys
/** Calls resolver to generate one or more public/private key pairs for a specific blockchain */
async function handleGenerateKeys(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/generate-keys'
  let context
  try {
    globalLogger.trace('called handleGenerateKeys')
    checkForRequiredHeaderValues(req, ['api-key', 'auth-token'])
    checkForRequiredBodyValues(req, ['chainType', 'authToken'])
    const { asymmetricOptions, chainType, keyCount, symmetricOptions } = req.body

    // validate params
    if (!symmetricOptions && !asymmetricOptions) {
      const msg = `Missing required parameter(s) in request body. Must provide at least one of these parameters: asymmetricOptions, symmetricOptions`
      throw new ServiceError(msg, ErrorType.BadParam, funcName)
    }
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    const authToken = await validateAuthTokenAndExtractContents(req, context)
    const password = authToken?.secrets?.password
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

// /api/sign
/** Calls resolver to sign a transaction with one or more private key pairs for a specific blockchain */
async function handleSign(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/sign'
  let context
  try {
    globalLogger.trace('called handleSign')
    checkForRequiredHeaderValues(req, ['api-key', 'auth-token'])
    checkForRequiredBodyValues(req, ['chainType', 'payloadToSign'])
    const {
      asymmetricOptions,
      chainType,
      payloadToSign,
      symmetricOptions,
      asymmetricEncryptedPrivateKeys,
      symmetricEncryptedPrivateKeys,
    } = req.body

    // validate params
    if (!asymmetricEncryptedPrivateKeys && !symmetricEncryptedPrivateKeys) {
      const msg = `Missing required parameter(s) in request body. Must provide at least one of these parameters: asymmetricEncryptedPrivateKeys, symmetricEncryptedPrivateKeys`
      throw new ServiceError(msg, ErrorType.BadParam, funcName)
    }
    if (
      (asymmetricEncryptedPrivateKeys && !Array.isArray(asymmetricEncryptedPrivateKeys)) ||
      (symmetricEncryptedPrivateKeys && !Array.isArray(symmetricEncryptedPrivateKeys))
    ) {
      const msg = `Bad parameter(s) in request body. ...EncryptedPrivateKeys parameter(s) must be an array. If only have one value, enclose it in an array i.e. [ ].`
      throw new ServiceError(msg, ErrorType.BadParam, funcName)
    }
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    const authToken = await validateAuthTokenAndExtractContents(req, context)
    const password = authToken?.secrets?.password
    const response = await signResolver(
      {
        chainType,
        password,
        payloadToSign,
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

// /api/public-key
/** Returns the public key for which all incoming secrets should be asymmetrically encrypted */
async function handlePublicKey(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/public-key'
  let context
  try {
    globalLogger.trace('called handlePublicKey')
    checkForRequiredHeaderValues(req, ['api-key'])
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    return returnResponse(req, res, HttpStatusCode.OK_200, { publicKey: BASE_PUBLIC_KEY }, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Critical, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context)
  }
}

export { v1Root }
