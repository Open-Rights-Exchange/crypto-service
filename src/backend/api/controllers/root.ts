import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { logger as globalLogger } from '../../helpers'
import {
  checkBodyForAtLeastOneOfValues,
  checkBodyForOnlyOneOfValues,
  checkBodyForRequiredValues,
  checkHeaderForRequiredValues,
  getAppIdAndContextFromApiKey,
  returnResponse,
  validateAuthToken,
  validatePasswordAuthToken,
} from '../helpers'
import { ErrorSeverity, ErrorType, HttpStatusCode } from '../../models'
import { BASE_PUBLIC_KEY } from '../../constants'
import {
  decryptWithPasswordResolver,
  decryptWithPrivateKeysResolver,
  encryptResolver,
  generateKeysResolver,
  signResolver,
} from '../../resolvers/crypto'
import { logError, ServiceError } from '../../resolvers/errors'

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
    case 'public-key':
      return handlePublicKey(req, res, next)
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
    checkHeaderForRequiredValues(req, ['api-key', 'auth-token'], funcName)
    checkBodyForRequiredValues(req, ['chainType', 'encrypted', 'symmetricOptions'], funcName)
    const { chainType, encrypted, returnAsymmetricOptions, symmetricOptions } = req.body
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    await validateAuthToken(req, context)
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
  try {
    globalLogger.trace('called handleDecryptWithPrivateKeys')
    checkHeaderForRequiredValues(req, ['api-key', 'auth-token'], funcName)
    checkBodyForRequiredValues(req, ['chainType', 'encrypted'], funcName)
    checkBodyForOnlyOneOfValues(req, ['asymmetricEncryptedPrivateKeys', 'symmetricEncryptedPrivateKeys'], funcName)
    const {
      chainType,
      encrypted,
      asymmetricEncryptedPrivateKeys,
      symmetricEncryptedPrivateKeys,
      symmetricOptionsForEncryptedPrivateKeys,
      returnAsymmetricOptions,
    } = req.body

    ;({ context } = await getAppIdAndContextFromApiKey(req))
    await validateAuthToken(req, context)
    const passwordAuthToken = await validatePasswordAuthToken(
      req,
      symmetricOptionsForEncryptedPrivateKeys,
      encrypted,
      context,
    )
    const password = passwordAuthToken?.secrets?.password
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

// api/encrypt
/** Calls resolver to encrypt the payload using one or more public/private key pairs for a specific blockchain */
export async function handleEncrypt(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/encrypt'
  let context
  try {
    globalLogger.trace('called handleEncrypt')
    checkHeaderForRequiredValues(req, ['api-key', 'auth-token'], funcName)
    checkBodyForRequiredValues(req, ['chainType', 'toEncrypt'], funcName)
    checkBodyForAtLeastOneOfValues(req, ['asymmetricOptions', 'symmetricOptions'], funcName)
    const { asymmetricOptions, chainType, toEncrypt, symmetricOptions } = req.body

    ;({ context } = await getAppIdAndContextFromApiKey(req))
    await validateAuthToken(req, context)
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
    checkHeaderForRequiredValues(req, ['api-key', 'auth-token'], funcName)
    checkBodyForRequiredValues(req, ['chainType'], funcName)
    checkBodyForAtLeastOneOfValues(req, ['asymmetricOptions', 'symmetricOptions'], funcName)
    const { asymmetricOptions, chainType, keyCount, symmetricOptions } = req.body

    ;({ context } = await getAppIdAndContextFromApiKey(req))
    await validateAuthToken(req, context)
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
  try {
    globalLogger.trace('called handleSign')
    checkHeaderForRequiredValues(req, ['api-key', 'auth-token'], funcName)
    checkBodyForRequiredValues(req, ['chainType', 'toSign'], funcName)
    checkBodyForAtLeastOneOfValues(req, ['asymmetricEncryptedPrivateKeys', 'symmetricEncryptedPrivateKeys'], funcName)
    const {
      chainType,
      toSign,
      symmetricOptions,
      asymmetricEncryptedPrivateKeys,
      symmetricEncryptedPrivateKeys,
    } = req.body

    if (
      (asymmetricEncryptedPrivateKeys && !Array.isArray(asymmetricEncryptedPrivateKeys)) ||
      (symmetricEncryptedPrivateKeys && !Array.isArray(symmetricEncryptedPrivateKeys))
    ) {
      const msg = `Bad parameter(s) in request body. ...EncryptedPrivateKeys parameter(s) must be an array. If only have one value, enclose it in an array i.e. [ ].`
      throw new ServiceError(msg, ErrorType.BadParam, funcName)
    }

    ;({ context } = await getAppIdAndContextFromApiKey(req))
    await validateAuthToken(req, context)
    const passwordAuthToken = await validatePasswordAuthToken(req, symmetricOptions, toSign, context)
    const password = passwordAuthToken?.secrets?.password
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
export async function handlePublicKey(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/public-key'
  let context
  try {
    globalLogger.trace('called handlePublicKey')
    checkHeaderForRequiredValues(req, ['api-key'], funcName)
    ;({ context } = await getAppIdAndContextFromApiKey(req))
    return returnResponse(req, res, HttpStatusCode.OK_200, { publicKey: BASE_PUBLIC_KEY }, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Critical, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context)
  }
}

export { v1Root }
