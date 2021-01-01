import { ChainError } from '../models/chain'
import { logger as globalLogger } from '../helpers'
import { Context, ErrorType, ErrorSeverity } from '../models'

/**
 *  Enhanced Error object to provide additional info that includes chain error details
 *  message - Primary error message - returned to the caller
 *  type - An ErrorType intended to be presented to the user
 *  internalDetails - Additional info logged interally - not returned to the caller
 *  originalError - The original error object that caused the issue
 *  chainError - The original error object thrown by the chain (if any)
 */
export class ServiceError extends Error {
  /** Chain-specific error throw by chain (via chainJs) */
  public chainError?: ChainError

  /** Additional info logged interally - not returned to the caller */
  public internalDetails: string

  /** A simple code intended to return to caller */
  public type?: ErrorType

  /** original error from which this error was composed */
  public originalError: Error

  constructor(
    message: string,
    type?: ErrorType,
    internalDetails?: string,
    originalError?: Error,
    chainError?: ChainError,
  ) {
    super(message)
    this.chainError = chainError
    this.type = type
    this.originalError = originalError
    this.internalDetails = internalDetails
    Object.setPrototypeOf(this, ServiceError.prototype)
  }
}

/** Record an error in loggin service */
export function logError(
  context: Context,
  error: Error,
  errorSeverity: ErrorSeverity = ErrorSeverity.Info,
  funcName = '',
) {
  let { logger } = context || {}
  if (!logger) logger = globalLogger
  const { errorCode, errorMessage } = composeErrorResponse(context, error)
  const messageToLog = `Error: ${funcName ? `(${funcName}) ` : ''}${errorCode}${errorCode ? ': ' : ''}${errorMessage}` // Format: (funcName) error_code: error description
  if (errorSeverity === ErrorSeverity.Info) logger.log(messageToLog, null, error, false)
  if (errorSeverity === ErrorSeverity.Debug) logger.log(messageToLog, null, error, true) // only emitted when tracing is enabled
  if (errorSeverity === ErrorSeverity.Critical) logger.error(messageToLog, error)
}

/** Compose error response object from Error (or ServiceError) */
export function composeErrorResponse(context: Context, error: Error): { errorCode?: string; errorMessage?: string } {
  const appId = (context || {})?.appId
  const serviceError = error as ServiceError
  let errorResponse = {}
  if (serviceError?.type || serviceError?.internalDetails) {
    errorResponse = {
      errorCode: serviceError?.type,
      errorMessage: `${serviceError?.message || ''}${appId ? ` appId:${appId}` : ''}`,
    }
  } else {
    errorResponse = error?.message ? { errorMessage: `${error?.message || ''}` } : {}
  }
  return errorResponse
}
