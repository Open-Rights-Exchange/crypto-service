import { isNullOrEmpty, isValidDate, tryBase64Decode } from 'aikon-js'
import { convertStringifiedJsonOrObjectToObject, createSha256Hash } from '../helpers'
import { AnalyticsEvent, AuthToken, Context, ErrorType, Mongo } from '../models'
import { AuthTokenData } from '../services/mongo/models'
import { findOneMongo, upsertMongo } from '../services/mongo/resolvers'
import { ServiceError } from './errors'
import { analyticsEvent } from '../services/segment/resolvers'
import { decryptWithBasePrivateKey } from './crypto'

/** Extract auth-token from header of request and verifies that it is valid
 *  Checks that it was signed by the public key in encryptedKey, hasn't expired, and has not been used
 *  hashOfPayload - the hash of the stringified JSON object of all params set to called function along with this authToken
 *  Returns data extracted from authToken
 */
export async function validateAuthTokenAndExtractContents(
  base64EncodedAuthToken: string,
  requestBody: any,
  context: Context,
): Promise<AuthToken> {
  const { appId } = context
  const encryptedAuthToken = tryBase64Decode(base64EncodedAuthToken)
  if (isNullOrEmpty(encryptedAuthToken)) {
    const msg = `Missing required parameter in request Header. Must provide auth-token.`
    throw new ServiceError(msg, ErrorType.AuthTokenValidation, `validateAuthTokenAndExtractContents`)
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
    const msg = `Auth Token is malformed or missing a required value when decrypted.`
    throw new ServiceError(msg, ErrorType.AuthTokenValidation, `validateAuthTokenAndExtractContents`)
  }

  // VERIFY: valid date/time
  const validFromDate = new Date(validFrom).getTime()
  const validToDate = new Date(validTo).getTime()
  const now = new Date()
  const nowUtc = now.getTime()
  const isValidNow = nowUtc >= validFromDate && nowUtc <= validToDate
  // TODO: confirm validToDate is not too far in future - i.e. <= AUTH_TOKEN_MAX_EXPIRATION_IN_SECONDS
  if (!isValidNow) {
    const msg = `Auth Token has expired or is not valid at the current time: ${now}.`
    throw new ServiceError(msg, ErrorType.AuthTokenValidation, `validateAuthTokenAndExtractContents`)
  }

  // VERIFY: payloadHash matches hash of request body
  const body = JSON.stringify(requestBody || '')
  const hashOfBody = createSha256Hash(body)
  if (hashOfBody !== payloadHash) {
    const msg = `Auth Token payloadHash does not match Sha256Hash of request body.`
    throw new ServiceError(msg, ErrorType.AuthTokenValidation, `validateAuthTokenAndExtractContents: ${body}`)
  }

  // Return decoded token
  const authToken: AuthToken = {
    payloadHash,
    validFrom: new Date(validFrom),
    validTo: new Date(validTo),
    secrets,
  }

  // Save authToken to prevent replay
  await saveAuthToken({ authToken, context, base64EncodedAuthToken })

  return authToken
}

type SaveAuthTokenParam = {
  base64EncodedAuthToken: string
  authToken: AuthToken
  context: Context
}

/**
 * Save authToken until it expires - when it expires, it will be automatically deleted from the table
 */
export async function saveAuthToken({ authToken, context, base64EncodedAuthToken }: SaveAuthTokenParam) {
  const { appId, logger } = context

  // check if token is already saved - if, we cant use it again
  const existingAuthToken = await findOneMongo<AuthTokenData>({
    context,
    mongoObject: Mongo.AuthToken,
    filter: { token: base64EncodedAuthToken },
  })

  if (existingAuthToken) {
    throw new ServiceError('Auth token has already been used.', ErrorType.AuthTokenValidation, 'saveAuthToken')
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
}
