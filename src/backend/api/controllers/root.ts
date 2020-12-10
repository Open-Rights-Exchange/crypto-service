import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { logger as globalLogger } from '../../utils/helpers'
import { returnResponse, getAppIdAndContext, checkForRequiredHeaderValues } from '../helpers'
import { HttpStatusCode } from '../../models'
import { BASE_PUBLIC_KEY } from '../../constants'

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
/** Generates one or more public/private key pairs for a specific blockchain */
async function handleGenerateKeys(req: Request, res: Response, next: NextFunction) {
  let appId, context
  try {
    globalLogger.trace('called handleGenerateKeys')
    checkForRequiredHeaderValues(req, ['api-key'])
    ;({ context, appId } = await getAppIdAndContext(req))

    // TODO: chains.generateKeys
    const response = {}

    return returnResponse(req, res, appId, HttpStatusCode.OK_200, response , context)
  } catch (error) {
    const errResponse = { message: 'Problem handling /generate-keyS request', error: error.toString() }
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
