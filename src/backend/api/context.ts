import { Request } from 'express'
import { globalLogger } from '../../helpers/logger'
import { generateProcessId, Logger, isNullOrEmpty, objectHasProperty, assertValidChainType } from '../../helpers'
import { Analytics } from '../services/segment/resolvers'
import { getRollbar } from '../services/rollbar/connectors'
import { AppId, ChainType, Config, Context, ErrorType } from '../../models'
import { getAppIdFromApiKey } from '../resolvers/appRegistration'
import { ServiceError } from '../../helpers/errors'

/**
 *  Create a statefull context for each request
 *  This context will be passed to mutations that update the database
 * */
export function createContext(req: Request, config: Config, requestDateTime: Date, appId?: AppId): Context {
  const { constants } = config || {}
  const { logger, processId } = getProcessIdAndLogger(req, config)
  const analytics = new Analytics(constants?.SEGMENT_WRITE_KEY, processId)
  const chainType = ChainType.NoChain
  const context: Context = { analytics, appId, chainType, constants, logger, processId, requestDateTime }
  if (appId) context.appId = appId
  return context
}

export const getProcessIdAndLogger = (req: Request, config: Config) => {
  const { constants, settings } = config || {}
  const processId = getOrCreateProcessId(req)
  const rollbar = getRollbar(constants)
  const logger = new Logger({ rollbar, processId, tracingEnabled: settings?.tracingEnabled })
  return { processId, logger }
}

//* get unique processId from request header - or generate one if not there */
const getOrCreateProcessId = (req: Request) => {
  let processId = generateProcessId()
  if (objectHasProperty(req, 'process-id')) {
    processId = req.headers['process-id'] as string
  }
  return processId
}

/** use request headers to determine appId, serviceID, and processId
 * also creates a context object from these values */
export async function addAppIdAndChainTypeToContextFromApiKey(req: Request, context: Context) {
  const { logger } = context
  // add chainType to context if provided in request body - throw if invalid
  const chainType = req?.body?.chainType
  if (chainType) {
    assertValidChainType(chainType)
    context.chainType = chainType
  }
  const appId = await getAppIdFromApiKey(req.headers['api-key'] as string, context)
  if (isNullOrEmpty(appId)) {
    throw new ServiceError(
      'Missing required header parameter: api-key',
      ErrorType.BadParam,
      'getAppIdAndContextFromApiKey',
    )
  }

  if (appId) context.appId = appId
  logger.trace(`getAppIdAndContext got appId ${appId}`)

  return { appId }
}

/** Fallback context - used before a request-specific context is created */
export const ContextGlobal = {
  processId: globalLogger.processId,
  logger: globalLogger,
}
