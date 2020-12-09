import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { logger as globalLogger } from '../../utils/helpers'
import { returnResponse, getAppIdAndContext, checkForRequiredHeaderValues } from '../helpers'
import { HttpStatusCode } from '../../models'
import { AppAccessToken } from '../../models/data'

dotenv.config()

// Root-level routes
// TODO: remove /user route once lumeos and everipedia are no longer using it
async function v1Root(req: Request, res: Response, next: NextFunction) {
  const { action } = req.params
  switch (action) {
    case 'app-token':
      return handleAppToken(req, res, next)
    default:
      return returnResponse(req, res, HttpStatusCode.NOT_FOUND_404, { message: 'Not a valid endpoint' }, null)
  }
}

// Returns an appToken
// localhost:8080/api/app-token
async function handleAppToken(req: Request, res: Response, next: NextFunction) {
  let appId
  let context
  try {
    globalLogger.trace('called handleAppToken')
    const { newAccountPassword, currentAccountPassword, secrets } = req.body
    ;({ context, appId } = await getAppIdAndContext(req))
    // assertAppAccessTokenValidSecrets(secrets, context)
    checkForRequiredHeaderValues(req, ['api-key'])
    const metadata: AppAccessToken['metadata'] = {}
    if (newAccountPassword) metadata.newAccountPassword = newAccountPassword
    if (currentAccountPassword) metadata.currentAccountPassword = currentAccountPassword
    if (secrets) metadata.secrets = secrets

    // Return a token that only includes the appId as a custom claim. This is then sent to the web app to trigger the user Oauth flow
    const appToken = 'missing-app-token' // await createAppAccessToken({ context, appId, metadata })
    return returnResponse(req, res, HttpStatusCode.OK_200, { appAccessToken: appToken }, context)
  } catch (error) {
    return returnResponse(
      req,
      res,
      HttpStatusCode.BAD_REQUEST_400,
      { message: 'Problem handling /app-token request :', error: error.toString() },
      context,
    )
  }
}

export { v1Root }
