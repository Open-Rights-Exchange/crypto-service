import { Request, Response } from 'express'
import url from 'url'
import { generateProcessId, Logger, isNullOrEmpty, isAString } from 'aikon-js'
import dotenv from 'dotenv'
import { analyticsEvent } from '../services/segment/resolvers'
import { rollbar } from '../services/rollbar/connectors'
import { HttpStatusCode, Context, AnalyticsEvent, AppId } from '../models'
import { getAppIdFromApiKey } from '../resolvers/appRegistration'

dotenv.config()

const settingTracingEnabled = true // TODO: Move this to runtime settings

// ---- Helper functions

const getOrCreateProcessId = (req: Request) => {
  return (req.headers['process-id'] as string) || generateProcessId()
}

export const getProcessIdAndLogger = (req: Request) => {
  const processId = getOrCreateProcessId(req)
  const logger = new Logger({ rollbar, processId, tracingEnabled: settingTracingEnabled })
  return { processId, logger }
}

export function createContext(req: Request, appId?: AppId): Context {
  const { logger, processId } = getProcessIdAndLogger(req)
  const context = { appId, logger, processId }
  return context
}

/** use request headers to determine appId, serviceID, and processId
 * also creates a context object from these values */
export async function getAppIdAndContext(req: Request) {
  // this context can be passed to mutations that update the database
  const context = createContext(req)
  const { logger } = context

  // appId
  const appId = await getAppIdFromApiKey(req.headers['api-key'] as string, context)
  if (isNullOrEmpty(appId)) {
    throw new Error('Missing required header parameter: api-key')
  }

  context.appId = appId
  logger.trace(`getAppIdAndContext got appId ${appId}`)

  return { appId, context }
}

// check the url's query params for each required param in paramNames
export function checkForRequiredParams(req: Request, paramNames: any[]) {
  const missing: any = []
  paramNames.forEach(p => {
    if (isNullOrEmpty(req.query[p])) {
      missing.push(p)
    }
  })
  if (!isNullOrEmpty(missing)) {
    throw new Error(`Missing required parameter(s): ${missing.join(', ')}`)
  }
}

// check the header of the request for each required param in paramNames
export function checkForRequiredHeaderValues(req: Request, paramNames: any[]) {
  const missing: any[] = []
  paramNames.forEach(p => {
    if (isNullOrEmpty(req.headers[p])) {
      missing.push(p)
    }
  })
  if (!isNullOrEmpty(missing)) {
    throw new Error(`Missing required parameter(s) in request header: ${missing.join(', ')}`)
  }
}

// check the body of the request for each required param in paramNames
export function checkForRequiredBodyValues(req: Request, paramNames: any[]) {
  const missing: any[] = []
  paramNames.forEach(p => {
    if (isNullOrEmpty(req.body[p])) {
      missing.push(p)
    }
  })
  if (!isNullOrEmpty(missing)) {
    throw new Error(`Missing required parameter(s) in request body: ${missing.join(', ')}`)
  }
}

export function analyticsForApi(req: Request, data: any, context: Context) {
  const path = req.baseUrl
  // TODO: Replace depricated api (url.parse)
  const { query } = url.parse(req.url) // eslint-disable-line 
  analyticsEvent('api', AnalyticsEvent.ApiCalled, { path, query, ...data }, context)
}

export function returnResponse(
  req: Request,
  res: Response,
  appId: AppId,
  httpStatusCode: number,
  responseToReturn: any,
  context: Context,
) {
  let errorResponse
  if (httpStatusCode !== HttpStatusCode.OK_200) {
    errorResponse = responseToReturn
  }
  // if no context provided, create one (in part, to get processId from request header)
  if (!context) {
    context = createContext(req)
  }
  analyticsForApi(req, { httpStatusCode, appId, errorResponse }, context)
  return res.status(httpStatusCode).json({ processId: context?.processId, ...responseToReturn })
}

export function parseMultisigChainAccounts(multiSigChainAccounts: string) {
  if (!isAString(multiSigChainAccounts)) {
    return null
  }
  return multiSigChainAccounts.split(',').map(ma => ma.trim()) // remove whitespace between commas
}
