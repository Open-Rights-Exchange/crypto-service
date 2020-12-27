import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { getAppIdAndContextFromApiKey, checkForRequiredParams, returnResponse } from '../helpers'
import { ErrorSeverity, HttpStatusCode } from '../../models'
import { logError } from '../../resolvers/errors'

dotenv.config()

// Admin Route
// must be using the api-key for the admin app
// expects a param to desginate action ?action=nnn
// e.g. http://localhost:8080/api/admin?action=refresh
async function v1Admin(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/admin'
  const { context } = await getAppIdAndContextFromApiKey(req)
  try {
    checkForRequiredParams(req, ['action'], funcName)
    const { action }: any = req.query
    switch (action) {
      case 'refresh':
        // reload settings and flush caches
        return await handleAdminRefresh(req, res, next)
      default:
        return returnResponse(req, res, HttpStatusCode.NOT_FOUND_404, { errorMessage: 'Not a valid endpoint' }, null)
    }
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.NOT_FOUND_404, null, null, error)
  }
}

// Reload settings and flush cache(s)
async function handleAdminRefresh(req: Request, res: Response, next: NextFunction) {
  const funcName = 'api/admin?action=refresh'
  const { context } = await getAppIdAndContextFromApiKey(req)
  // clearAllCaches()
  // await loadDatabaseSettings(context)
  return returnResponse(req, res, HttpStatusCode.OK_200, { messsage: 'Settings and cache reloaded.' }, context)
}

export { v1Admin }
