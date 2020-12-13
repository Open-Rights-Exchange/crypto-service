import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { logger as globalLogger } from '../../utils/helpers'
import { returnResponse, getAppIdAndContext, checkForRequiredHeaderValues, checkForRequiredBodyValues } from '../helpers'
import { HttpStatusCode } from '../../models'
import { assertValidChainType } from '../../models/helpers'
import { BASE_PUBLIC_KEY } from '../../constants'
import { generateKeysResolver } from '../../resolvers/crypto'

dotenv.config()

// Root-level routes
// TODO: remove /user route once lumeos and everipedia are no longer using it
async function v1Root(req: Request, res: Response, next: NextFunction) {
  const { action } = req.params
  switch (action) {
    case 'generate-keys':
      return handleGenerateKeys(req, res, next)
    case 'public-key':
      return handlePublicKey(req, res, next)
    default:
      return returnResponse(req, res, null, HttpStatusCode.NOT_FOUND_404, { message: 'Not a valid endpoint' }, null)
  }
}

// localhost:8080/api/generate-keys
/** Calls resolver to generate one or more public/private key pairs for a specific blockchain */
async function handleGenerateKeys(req: Request, res: Response, next: NextFunction) {
  let appId, context
  try {
    globalLogger.trace('called handleGenerateKeys')
    checkForRequiredHeaderValues(req, ['api-key'])
    checkForRequiredBodyValues(req, ['chainType', 'authToken'])
    const {
      authToken,
      asymmetricOptions,
      chainType,
      keyCount,
      symmetricOptions,
    } = req.body

    // validate params
    if(!symmetricOptions && !asymmetricOptions) {
      throw new Error(`Missing required parameter(s) in request body. Must provide at least one of these parameters: asymmetricOptions, symmetricOptions`)
    }
    ;({ context, appId } = await getAppIdAndContext(req))

    const response = await generateKeysResolver({chainType, keyCount, asymmetricOptions, symmetricOptions, authToken}, context, appId)

    return returnResponse(req, res, appId, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    const errResponse = { message: 'Problem handling /generate-keys request', error: error.toString() }
    return returnResponse(req, res, appId, HttpStatusCode.BAD_REQUEST_400, errResponse, context)
  }
}

// localhost:8080/api/public-key
/** Returns the public key for which all incoming secrets should be asymmetrically encrypted */
async function handlePublicKey(req: Request, res: Response, next: NextFunction) {
  let appId, context
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
