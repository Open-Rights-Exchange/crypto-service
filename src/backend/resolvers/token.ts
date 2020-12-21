import { NextFunction, Request, Response } from 'express'
import { isNullOrEmpty, isValidDate, tryBase64Decode } from 'aikon-js'
import { convertStringifiedJsonOrObjectToObject, createSha256Hash } from '../utils/helpers'
import { AnalyticsEvent, AppId, AuthToken, Context, ErrorCode, Mongo, ResultWithErrorCode } from '../models'
import { decryptWithBasePrivateKey } from './crypto'
import { AuthTokenData } from '../services/mongo/models'
import { findOneMongo, upsertMongo } from '../services/mongo/resolvers'
import { analyticsEvent } from '../services/segment/resolvers'

/** Extract auth-token from header of request and verifies that it is valid
 *  Checks that it was signed by the public key in encryptedKey, hasn't expired, and has not been used
 *  hashOfPayload - the hash of the stringified JSON object of all params set to called function along with this authToken
 *  Returns data extracted from authToken
 */
export async function assertValidAuthTokenAndExtractContents(
  req: Request,
  context: Context,
  appId: AppId,
): Promise<AuthToken> {
  const base64EncodedAuthToken = req.headers['auth-token'] as string
  const encryptedAuthToken = tryBase64Decode(base64EncodedAuthToken)
  if (isNullOrEmpty(encryptedAuthToken)) {
    throw new Error(`Missing required parameter in request Header. Must provide auth-token.`)
  }

  // Example Auth Token
  //   { payloadHash: 'adadasdsad==',
  //     validFrom: '2020-12-20T00:00:00Z',
  //     validTo: '2020-12-20T23:59:59Z',
  //     secrets: {
  //        password: 'mypassword'
  //     }
  //   }

  // decrypt
  let decryptedAuthToken: any = await decryptWithBasePrivateKey({ encrypted: encryptedAuthToken }, context, appId)
  decryptedAuthToken = convertStringifiedJsonOrObjectToObject(decryptedAuthToken)

  // validate params
  const { payloadHash, validFrom, validTo, secrets } = decryptedAuthToken
  if (!payloadHash || !isValidDate(validFrom) || !isValidDate(validTo)) {
    throw new Error(`Auth Token is malformed or missing a required value when decrypted.`)
  }

  // VERIFY: valid date/time
  const validFromDate = new Date(validFrom).getTime()
  const validToDate = new Date(validTo).getTime()
  const now = new Date()
  const nowUtc = now.getTime()
  const isValidNow = nowUtc >= validFromDate && nowUtc <= validToDate
  // TODO: confirm validToDate is not too far in future - i.e. <= AUTH_TOKEN_MAX_EXPIRATION_IN_SECONDS
  if (!isValidNow) {
    throw new Error(`Auth Token has expired or is not valid at the current time: ${now}.`)
  }

  // VERIFY: payloadHash matches hash of request body
  const bodyStringified = JSON.stringify(req.body || '')
  const hashOfBody = createSha256Hash(bodyStringified)
  if (hashOfBody !== payloadHash) {
    throw new Error(`Auth Token payloadHash does not match Sha256Hash of request body.`)
  }

  // Return decoded token
  const authToken: AuthToken = {
    payloadHash,
    validFrom: new Date(validFrom),
    validTo: new Date(validTo),
    secrets,
  }

  // Save authToken to prevent replay
  const result = await saveAuthToken({ appId, authToken, context, base64EncodedAuthToken })
  if (!result.success) {
    throw new Error(`${result?.errorCode}: ${result.errorMessage}`)
  }

  return authToken
}

type SaveAuthTokenParam = {
  appId: AppId
  base64EncodedAuthToken: string
  authToken: AuthToken
  context: Context
}

/**
 * Save authToken until it expires - when it expires, it will be automatically deleted from the table
 */
export async function saveAuthToken({
  appId,
  authToken,
  context,
  base64EncodedAuthToken,
}: SaveAuthTokenParam): Promise<ResultWithErrorCode> {
  const { logger } = context

  try {
    // check if token is already saved - if, we cant use it again
    const existingAuthToken = await findOneMongo<AuthTokenData>({
      context,
      mongoObject: Mongo.AuthToken,
      filter: { token: base64EncodedAuthToken },
    })

    if (existingAuthToken) {
      return { success: false, errorCode: ErrorCode.AuthTokenValidation, errorMessage: 'Auth token has already been used.' }
    }

    // create a new authToken record
    const newItem = {
      appId,
      expiresOn: authToken.validTo,
      token: base64EncodedAuthToken,
    }
    await upsertMongo<AuthTokenData>({
      context,
      mongoObject: Mongo.AuthToken,
      newItem,
      skipUpdatedFields: true,
    })
    analyticsEvent('api', AnalyticsEvent.AuthTokenCreated, { appId }, context)
  } catch (error) {
    logger.error(`Problem saving authAccessToken for appId:${appId}`, error)
    throw new Error(`Problem saving authAccessToken`)
  }
  return { success: true }
}
