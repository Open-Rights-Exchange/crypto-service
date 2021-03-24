import { Request, Response } from 'express'
import url from 'url'
import { isNullOrEmpty, tryBase64Decode, tryParseJSON } from '../../helpers'
import {
  AnalyticsEvent,
  AsymmetricEncryptedData,
  AsymmetricEncryptedString,
  ChainType,
  Context,
  ErrorType,
  HttpStatusCode,
  SymmetricOptionsParam,
} from '../../models'
import { composeErrorResponse, ServiceError } from '../../helpers/errors'
import { StateStore } from '../../helpers/stateStore'
import { getChain } from '../chains/chainConnection'
import { deleteTransportKey, findTransportKeyAndDecryptPrivateKey } from '../resolvers/transportKey'
import { decryptAsymmetrically, getPrivateKeysForAsymEncryptedPayload } from '../resolvers/crypto'

// ---- Helper functions

/** check the url's query params for each required param in paramNames */
export function assertHasRequiredParams(req: Request, paramNames: any[], funcName: string) {
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
export function assertHeaderhasRequiredValues(req: Request, paramNames: any[], funcName: string) {
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
export function assertBodyhasRequiredValues(req: Request, paramNames: any[], funcName: string) {
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

/** check the body of the request - ensure that all params in list are an array (if exists) */
export function assertBodyValueIsArrayIfExists(req: Request, paramNames: any[], funcName: string) {
  const paramsNotAnArray = paramNames.filter(p => {
    return !isNullOrEmpty(req.body[p]) && !Array.isArray(req.body[p])
  })
  if (!isNullOrEmpty(paramsNotAnArray)) {
    throw new ServiceError(
      `Parameter(s) in request body must be an array: ${paramsNotAnArray.join(
        ', ',
      )}. If only one value, enclose it in an array i.e. [ ].`,
      ErrorType.BadParam,
      funcName,
    )
  }
}

/** check the body of the request - must include at least one of the params in the list */
export function assertBodyHasAtLeastOneOfValues(req: Request, paramNames: any[], funcName: string) {
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
export function assertBodyHasOnlyOneOfValues(req: Request, paramNames: any[], funcName: string) {
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
export async function returnResponse(
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
  // TODO: delete all transportKeys represented in payload(s)- should only be used once
  // await deleteTransportKey(req?.body?.transportPublicKey, context)
  // we wont have a context for well-known endpoint
  if (context) {
    analyticsForApi(req, { httpStatusCode, appId, errorResponse }, context)
  }
  return res.status(httpStatusCode).json({ processId: context?.processId, ...responseToReturn })
}

/** Validate validateEncryptedPayload helper - confirms it was encrypted with valid transport public key and extracts from request */
export async function extractEncryptedPayload(
  encryptedPayload: AsymmetricEncryptedString | AsymmetricEncryptedData | AsymmetricEncryptedData[],
  paramName: string,
  context: Context,
  state: StateStore,
): Promise<AsymmetricEncryptedData[]> {
  if (isNullOrEmpty(encryptedPayload)) return null
  const decodedEncryptedPayload = tryBase64Decode(encryptedPayload)
  if (isNullOrEmpty(decodedEncryptedPayload)) {
    throw new ServiceError(
      `Corrupted encryptedPayload in ${paramName} value. Expected a base64-encoded string`,
      ErrorType.BadParam,
      'extractEncryptedPayload',
    )
  }

  const decryptedPayload = await unwrapTransportEncryptedPayload({
    encryptedPayload: decodedEncryptedPayload,
    context,
  })
  let decryptedPayloadObject = tryParseJSON(decryptedPayload)

  // if not an array, wrap in one
  if (!Array.isArray) decryptedPayloadObject = [decryptedPayloadObject]

  return decryptedPayloadObject as AsymmetricEncryptedData[]
}

/** Compose the full url of the request */
export function getFullUrlFromRequest(req: Request) {
  // if hosted behind a proxy, check the incoming protocol first
  const protocol = req.headers['x-forwarded-proto'] || req.protocol
  return `${protocol}://${req.get('host')}${req.originalUrl}`
}

export type DecryptTransportEncryptedPayloadParams = {
  encryptedPayload?: string
  context: Context
}

/** Unwrap encryptedPayload (using private key associated with transportPublicKey) */
export async function unwrapTransportEncryptedPayload(params: DecryptTransportEncryptedPayloadParams) {
  const { context, encryptedPayload } = params
  const chainConnectNoChain = await getChain(ChainType.NoChain, context)

  // decrypt if necessary
  let decryptedPayload
  if (encryptedPayload) {
    const encryptedPayloadString = chainConnectNoChain.chainFunctions.toAsymEncryptedDataString(encryptedPayload)
    // gets private keys needed to decrypy payload - looks in transport key store
    const privateKeys = await getPrivateKeysForAsymEncryptedPayload(ChainType.NoChain, encryptedPayloadString, context)
    decryptedPayload = await decryptAsymmetrically(
      chainConnectNoChain, // use NoChain so it wont expect public keys formatted for a specific chain - base public key is uncompressed
      { encrypted: chainConnectNoChain.chainFunctions.toAsymEncryptedDataString(encryptedPayload), privateKeys },
    )
  }

  return decryptedPayload
}

/** unwraps (decrypts) transportEncryptedPassword provided in symmetric options (using private key associated with transportPublicKey)
 *  sert symmetricOptions.password property to decrypted value */
export async function unwrapTransportEncryptedPasswordInSymOptions(
  symmetricOptions: SymmetricOptionsParam,
  context: Context,
): Promise<SymmetricOptionsParam> {
  if (!symmetricOptions?.password && !symmetricOptions?.transportEncryptedPassword) {
    const msg = `Symmetric options were provided but missing either password or transportEncryptedPassword - one is required.`
    throw new ServiceError(msg, ErrorType.BadParam, 'unwrapTransportEncryptedPasswordInSymOptions')
  }
  const hasEncryptedPw = !symmetricOptions?.password && symmetricOptions?.transportEncryptedPassword
  if (hasEncryptedPw) {
    const decodedTransportEncryptedPassword = tryBase64Decode(symmetricOptions?.transportEncryptedPassword)
    if (symmetricOptions?.transportEncryptedPassword && !decodedTransportEncryptedPassword) {
      const msg = `transportEncryptedPassword in symmetric options is malformed. Expected base64 encoded string`
      throw new ServiceError(msg, ErrorType.BadParam, 'unwrapTransportEncryptedPasswordInSymOptions')
    }
    const password = await unwrapTransportEncryptedPayload({
      encryptedPayload: decodedTransportEncryptedPassword, // base64 encoded
      context,
    })
    symmetricOptions.password = password
  }
  return symmetricOptions
}
