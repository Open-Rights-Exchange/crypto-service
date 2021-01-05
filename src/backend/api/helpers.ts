import { Request, Response } from 'express'
import url from 'url'
import { isNullOrEmpty, tryBase64Decode, tryParseJSON } from '../../helpers'
import {
  AnalyticsEvent,
  AppId,
  AsymmetricEncryptedData,
  AsymmetricEncryptedString,
  AuthToken,
  AuthTokenType,
  Context,
  ErrorType,
  HttpStatusCode,
  SymmetricOptionsParam,
} from '../../models'
import { composeErrorResponse, ServiceError } from '../../helpers/errors'
import { decryptWithBasePrivateKey } from '../resolvers/crypto'
import { validateAuthTokenAndExtractContents } from '../resolvers/token'
import { createContext } from './context'

// ---- Helper functions

/** check the url's query params for each required param in paramNames */
export function checkForRequiredParams(req: Request, paramNames: any[], funcName: string) {
  const missing: any = []
  paramNames.forEach(p => {
    if (isNullOrEmpty(req.query[p])) {
      missing.push(p)
    }
  })
  if (!isNullOrEmpty(missing)) {
    throw new ServiceError(`Missing required parameter(s): ${missing.join(', ')}`, ErrorType.BadParam, funcName)
  }
}

/** check the header of the request for each required param in paramNames */
export function checkHeaderForRequiredValues(req: Request, paramNames: any[], funcName: string) {
  const missing: any[] = []
  paramNames.forEach(p => {
    if (isNullOrEmpty(req.headers[p])) {
      missing.push(p)
    }
  })
  if (!isNullOrEmpty(missing)) {
    throw new ServiceError(
      `Missing required parameter(s) in request header: ${missing.join(', ')}`,
      ErrorType.BadParam,
      funcName,
    )
  }
}

/** check the body of the request for each required param in paramNames */
export function checkBodyForRequiredValues(req: Request, paramNames: any[], funcName: string) {
  const missing: any[] = []
  paramNames.forEach(p => {
    if (isNullOrEmpty(req.body[p])) {
      missing.push(p)
    }
  })
  if (!isNullOrEmpty(missing)) {
    throw new ServiceError(
      `Missing required parameter(s) in request body: ${missing.join(', ')}`,
      ErrorType.BadParam,
      funcName,
    )
  }
}

/** check the body of the request - must include at least one of the params in the list */
export function checkBodyForAtLeastOneOfValues(req: Request, paramNames: any[], funcName: string) {
  const matches = paramNames.filter(p => {
    return !isNullOrEmpty(req.body[p])
  })
  if (matches.length === 0) {
    throw new ServiceError(
      `Missing at least one of these parameters in request body: ${paramNames.join(', ')}`,
      ErrorType.BadParam,
      funcName,
    )
  }
}

/** check the body of the request - must include one and only one of params in the list */
export function checkBodyForOnlyOneOfValues(req: Request, paramNames: any[], funcName: string) {
  const matches = paramNames.filter(p => {
    return !isNullOrEmpty(req.body[p])
  })
  if (matches.length > 1) {
    throw new ServiceError(
      `You can only provide one of these parameters in request body: ${paramNames.join(', ')}`,
      ErrorType.BadParam,
      funcName,
    )
  }
}

/** Helper to log analytics for an API request */
export function analyticsForApi(req: Request, data: any, context: Context) {
  const path = req.baseUrl
  // TODO: Replace depricated api (url.parse)
  const { query } = url.parse(req.url)
  context?.analytics.event('api', AnalyticsEvent.ApiCalled, { path, query, ...data })
}

/** Return response and log analytics */
export function returnResponse(
  req: Request,
  res: Response,
  httpStatusCode: number,
  responseToReturn: any,
  context: Context,
  error?: Error,
) {
  const { appId } = context || {}
  let errorResponse

  if (httpStatusCode !== HttpStatusCode.OK_200) {
    errorResponse = composeErrorResponse(context, error)
    responseToReturn = { ...errorResponse, ...responseToReturn }
  }
  // if no context provided, create one (in part, to get processId from request header)
  if (!context) {
    context = createContext(req, null, new Date())
  }
  analyticsForApi(req, { httpStatusCode, appId, errorResponse }, context)
  return res.status(httpStatusCode).json({ processId: context?.processId, ...responseToReturn })
}

/** Validate token helper - extracts info from symmetric options */
export async function validatePasswordAuthToken(
  req: Request,
  symmetricOptions: SymmetricOptionsParam,
  /** principal value of function - e.g. for /sign, it the content toSign */
  bodyToVerify: any,
  context: Context,
) {
  if (isNullOrEmpty(symmetricOptions)) return null
  return validateAuthTokenAndExtractContents({
    authTokenType: AuthTokenType.Password,
    requestUrl: getFullUrlFromRequest(req),
    encryptedAuthToken: symmetricOptions?.passwordAuthToken, // base64 encoded
    requestBody: bodyToVerify,
    context,
  })
}

export type EncryptedAndAuthToken = {
  encrypted: AsymmetricEncryptedString
  authToken: AuthToken
}

/** Validate token helper - extracts info from request */
export async function validateEncryptedPayloadAuthToken(
  req: Request,
  encryptedAndAuthToken: AsymmetricEncryptedString | AsymmetricEncryptedData | AsymmetricEncryptedData[],
  paramName: string,
  context: Context,
) {
  if (isNullOrEmpty(encryptedAndAuthToken)) return null
  const decodedAuthToken = tryBase64Decode(encryptedAndAuthToken)
  if (isNullOrEmpty(decodedAuthToken)) {
    throw new ServiceError(
      `Corrupted authToken in ${paramName} value. Expected a base64-encoded string`,
      ErrorType.BadParam,
      'validateEncryptedPayloadAuthToken',
    )
  }

  const decodedEncryptedAndAuthToken: EncryptedAndAuthToken = tryParseJSON(
    await decryptWithBasePrivateKey({ encrypted: decodedAuthToken }, context),
  )

  if (isNullOrEmpty(decodedEncryptedAndAuthToken)) {
    throw new ServiceError(
      `Problem with ${paramName} value. Expected a stringified JSON object encypted using this service's public key`,
      ErrorType.BadParam,
      'validateEncryptedPayloadAuthToken',
    )
  }

  const authToken = await validateAuthTokenAndExtractContents({
    authTokenType: AuthTokenType.EncryptedPayload,
    requestBody: decodedEncryptedAndAuthToken?.encrypted,
    requestUrl: getFullUrlFromRequest(req),
    authToken: decodedEncryptedAndAuthToken?.authToken,
    context,
  })
  return {
    authToken,
    encrypted: decodedEncryptedAndAuthToken?.encrypted,
  }
}

/** Validate token helper - extracts info from request object */
export async function validateApiAuthToken(req: Request, context: Context) {
  return validateAuthTokenAndExtractContents({
    authTokenType: AuthTokenType.ApiHeader,
    requestUrl: getFullUrlFromRequest(req),
    encryptedAuthToken: req.headers['auth-token'] as string,
    requestBody: req?.body,
    context,
  })
}

/** Compose the full url of the request */
export function getFullUrlFromRequest(req: Request) {
  return `${req.protocol}://${req.get('host')}${req.originalUrl}`
}
