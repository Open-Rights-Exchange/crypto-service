import { NextFunction, Request, Response } from 'express'
import { addAppIdAndChainTypeToContextFromApiKey, createContext } from '../context'
import { assertHasRequiredParams, returnResponse } from '../helpers'
import { Config, ErrorSeverity, HttpStatusCode } from '../../../models'
import { logError } from '../../../helpers/errors'
import { StateStore } from '../../../helpers/stateStore'

// Admin Route
// must be using the api-key for the admin app
// expects a param to desginate action ?action=nnn
// e.g. http://localhost:8080/api/admin?action=refresh
async function v1Admin(req: Request, res: Response, next: NextFunction, config: Config, state: StateStore) {
  const funcName = 'api/admin'
  const now = new Date()
  const context = createContext(req, config, now)
  try {
    await addAppIdAndChainTypeToContextFromApiKey(req, context)
    assertHasRequiredParams(req, ['action'], funcName)
    const { action }: any = req.query
    switch (action) {
      case 'refresh':
        // reload settings and flush caches
        return await handleAdminRefresh(req, res, next, config)
      default:
        return await returnResponse(
          req,
          res,
          HttpStatusCode.NOT_FOUND_404,
          { errorMessage: 'Not a valid endpoint' },
          context,
        )
    }
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.NOT_FOUND_404, null, null, error)
  }
}

// Reload settings and flush cache(s)
async function handleAdminRefresh(req: Request, res: Response, next: NextFunction, config: Config) {
  const funcName = 'api/admin?action=refresh'
  const now = new Date()
  const context = createContext(req, config, now)
  await addAppIdAndChainTypeToContextFromApiKey(req, context)
  // clearAllCaches()
  // await loadDatabaseSettings(context)
  return returnResponse(req, res, HttpStatusCode.OK_200, { messsage: 'Settings and cache reloaded.' }, context)
}

export { v1Admin }
