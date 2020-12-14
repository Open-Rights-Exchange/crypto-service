import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { logger as globalLogger } from '../../utils/helpers'
import {
  returnResponse,
  getAppIdAndContext,
  checkForRequiredHeaderValues,
  checkForRequiredBodyValues,
} from '../helpers'
import { HttpStatusCode } from '../../models'
import { assertValidChainType } from '../../models/helpers'
import { BASE_PUBLIC_KEY } from '../../constants'
import { decryptWithPasswordResolver, encryptResolver, generateKeysResolver } from '../../resolvers/crypto'

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
    default:
      return returnResponse(req, res, null, HttpStatusCode.NOT_FOUND_404, { message: 'Not a valid endpoint' }, null)
  }
}

// /api/decrypt-with-password
/** Calls resolver to decrypt the payload using provided password and options */
async function handleDecryptWithPassword(req: Request, res: Response, next: NextFunction) {
  let appId
  let context
  try {
    globalLogger.trace('called handleDecryptWithPassword')
    checkForRequiredHeaderValues(req, ['api-key'])
    checkForRequiredBodyValues(req, ['authToken', 'chainType', 'encryptedPayload', 'symmetricOptions'])
    const { authToken, chainType, encryptedPayload, returnAsymmetricOptions, symmetricOptions } = req.body

    ;({ context, appId } = await getAppIdAndContext(req))

    const response = await decryptWithPasswordResolver(
      { authToken, chainType, encryptedPayload, symmetricOptions, returnAsymmetricOptions },
      context,
      appId,
    )

    return returnResponse(req, res, appId, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    const errResponse = { message: 'Problem handling /generate-keys request', error: error.toString() }
    return returnResponse(req, res, appId, HttpStatusCode.BAD_REQUEST_400, errResponse, context)
  }
}

// /api/encrypt
/** Calls resolver to encrypt the payload using one or more public/private key pairs for a specific blockchain */
async function handleEncrypt(req: Request, res: Response, next: NextFunction) {
  let appId
  let context
  try {
    globalLogger.trace('called handleEncrypt')
    checkForRequiredHeaderValues(req, ['api-key'])
    checkForRequiredBodyValues(req, ['authToken', 'chainType', 'payload'])
    const { authToken, asymmetricOptions, chainType, payload, symmetricOptions } = req.body

    // validate params
    if (!symmetricOptions && !asymmetricOptions) {
      throw new Error(
        `Missing required parameter(s) in request body. Must provide at least one of these parameters: asymmetricOptions, symmetricOptions`,
      )
    }
    ;({ context, appId } = await getAppIdAndContext(req))

    const response = await encryptResolver(
      { chainType, asymmetricOptions, symmetricOptions, authToken, payload },
      context,
      appId,
    )

    return returnResponse(req, res, appId, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    const errResponse = { message: 'Problem handling /generate-keys request', error: error.toString() }
    return returnResponse(req, res, appId, HttpStatusCode.BAD_REQUEST_400, errResponse, context)
  }
}

// /api/generate-keys
/** Calls resolver to generate one or more public/private key pairs for a specific blockchain */
async function handleGenerateKeys(req: Request, res: Response, next: NextFunction) {
  let appId
  let context
  try {
    globalLogger.trace('called handleGenerateKeys')
    checkForRequiredHeaderValues(req, ['api-key'])
    checkForRequiredBodyValues(req, ['chainType', 'authToken'])
    const { authToken, asymmetricOptions, chainType, keyCount, symmetricOptions } = req.body

    // validate params
    if (!symmetricOptions && !asymmetricOptions) {
      throw new Error(
        `Missing required parameter(s) in request body. Must provide at least one of these parameters: asymmetricOptions, symmetricOptions`,
      )
    }
    ;({ context, appId } = await getAppIdAndContext(req))

    const response = await generateKeysResolver(
      { chainType, keyCount, asymmetricOptions, symmetricOptions, authToken },
      context,
      appId,
    )

    return returnResponse(req, res, appId, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    const errResponse = { message: 'Problem handling /generate-keys request', error: error.toString() }
    return returnResponse(req, res, appId, HttpStatusCode.BAD_REQUEST_400, errResponse, context)
  }
}

// /api/public-key
/** Returns the public key for which all incoming secrets should be asymmetrically encrypted */
async function handlePublicKey(req: Request, res: Response, next: NextFunction) {
  let appId
  let context
  try {
    globalLogger.trace('called handlePublicKey')
    checkForRequiredHeaderValues(req, ['api-key'])
    ;({ context, appId } = await getAppIdAndContext(req))
    return returnResponse(req, res, appId, HttpStatusCode.OK_200, { publicKey: BASE_PUBLIC_KEY }, context)
  } catch (error) {
    const errResponse = { message: 'Problem handling /public-key request', error: error.toString() }
    return returnResponse(req, res, appId, HttpStatusCode.BAD_REQUEST_400, errResponse, context)
  }
}

export { v1Root }
