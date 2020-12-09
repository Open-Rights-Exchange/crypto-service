import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { getAppIdAndContext, checkForRequiredParams, returnResponse } from '../helpers'
import { HttpStatusCode } from '../../models'

dotenv.config()

// Admin Route
// must be using the api-key for the admin app
// expects a param to desginate action ?action=nnn
// e.g. http://localhost:8080/api/admin?action=refresh
async function v1Admin(req: Request, res: Response, next: NextFunction) {
  try {
    checkForRequiredParams(req, ['action'])
    const { action }: any = req.query
    switch (action) {
      case 'refresh':
        // reload settings and flush caches
        return await handleAdminRefresh(req, res, next)
      case 'admin-access-token':
        return await getAdminAccessToken(req, res)
      default:
        return returnResponse(req, res, HttpStatusCode.NOT_FOUND_404, { message: 'Not a valid endpoint' }, null)
    }
  } catch (error) {
    return returnResponse(
      req,
      res,
      HttpStatusCode.NOT_FOUND_404,
      { message: 'Problem handling /admin request', error: error.toString() },
      null,
    )
  }
}

async function getAdminAccessToken(req: Request, res: Response) {
  const { context, appId } = await getAppIdAndContext(req)
  const token = 'missing-token'
  return returnResponse(req, res, HttpStatusCode.OK_200, { adminAccessToken: token }, context)
}

// Reload settings and flush cache(s)
async function handleAdminRefresh(req: Request, res: Response, next: NextFunction) {
  const { context } = await getAppIdAndContext(req)
  // clearAllCaches()
  // await loadDatabaseSettings(context)
  return returnResponse(req, res, HttpStatusCode.OK_200, { messsage: 'Settings and cache reloaded.' }, null)
}

export { v1Admin }
