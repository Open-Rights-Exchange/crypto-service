import { Base64 } from 'js-base64'
import {
  convertStringifiedJsonOrObjectToObject,
  createSha256Hash,
  isNullOrEmpty,
  isValidDate,
  ServiceError,
  tryBase64Decode,
} from '../../helpers'
import { AnalyticsEvent, AuthToken, AuthTokenType, Context, ErrorType, Mongo } from '../../models'
import { AuthTokenData } from '../services/mongo/models'
import { findOneMongo, upsertMongo } from '../services/mongo/resolvers'
import { decryptWithBasePrivateKey, encryptAsymmetrically } from './crypto'

/** Decrypt and decode authToken
 *  Returns AuthToken object
 */
export async function decodeAuthToken(
  authTokenType: AuthTokenType,
  base64EncodedAuthToken: string,
  context: Context,
): Promise<AuthToken> {
  const encryptedAuthToken = tryBase64Decode(base64EncodedAuthToken)

  // throw if missing
  let errMsg = `Missing or corrupted parameter in request Header. Must provide auth-token.`
  if (isNullOrEmpty(encryptedAuthToken)) {
    if (authTokenType === AuthTokenType.Password) {
      errMsg = `Missing or corrupted auth token parameter in symmetrical options. Must provide base64-encoded PasswordAuthToken param.`
    } else if (authTokenType === AuthTokenType.EncryptedPayload) {
      errMsg = `Missing or corrupted auth token parameter in encryptedAndAuthToken. Must provide base64-encoded authToken wrapped in encryptedAndAuthToken param.`
    }
    throw new ServiceError(errMsg, ErrorType.AuthTokenValidation, `validateAuthTokenAndExtractContents`)
  }
  // decrypt
  const decryptedAuthToken = await decryptWithBasePrivateKey({ encrypted: encryptedAuthToken }, context)
  return mapAuthToken(convertStringifiedJsonOrObjectToObject(decryptedAuthToken))
}

/** Map to fully-typed object */
export function mapAuthToken(authTokenData: any) {
  return {
    ...authTokenData,
    validFrom: new Date(authTokenData?.validFrom),
    validTo: new Date(authTokenData?.validTo),
  }
}

export type ValidateAuthTokenAndExtractContents = {
  authTokenType: AuthTokenType
  encryptedAuthToken?: string
  authToken?: AuthToken
  requestBody: any
  requestUrl: string
  context: Context
}

/** Extract auth-token from header of request and verifies that it is valid
 *  Checks that it was signed by the public key in encryptedKey, hasn't expired, and has not been used
 *  hashOfPayload - the hash of the stringified JSON object of all params set to called function along with this authToken
 *  Returns data extracted from authToken
 *  Example Auth Token: 
    {
      url: 'https://crypto-service.io/generate-keys'
      payloadHash: 'adadasdsad==',
      validFrom: '2020-12-20T00:00:00Z',
      validTo: '2020-12-20T23:59:59Z',
      secrets: {
        password: 'mypassword'
      }
    }
 */
export async function validateAuthTokenAndExtractContents(
  params: ValidateAuthTokenAndExtractContents,
): Promise<AuthToken> {
  const { authTokenType, encryptedAuthToken, authToken, requestBody, requestUrl, context } = params

  // decrypt if necessary
  let decryptedAuthToken = authToken
  if (encryptedAuthToken) {
    decryptedAuthToken = await decodeAuthToken(authTokenType, encryptedAuthToken, context)
  }

  const { url, payloadHash, validFrom, validTo, secrets } = decryptedAuthToken

  // VERIFY: all required fields are in token
  if (!url || !isValidDate(validFrom) || !isValidDate(validTo)) {
    const msg = `Auth Token is malformed or missing a required value.`
    throw new ServiceError(msg, ErrorType.AuthTokenValidation, `validateAuthTokenAndExtractContents`)
  }

  // VERIFY: url in token matches request url
  if (url !== requestUrl) {
    const msg = `Auth Token url doesn't match actual request url ${requestUrl}.`
    throw new ServiceError(msg, ErrorType.AuthTokenValidation, `validateAuthTokenAndExtractContents`)
  }

  // VERIFY: valid date/time
  const validFromDate = new Date(validFrom).getTime()
  const validToDate = new Date(validTo).getTime()
  const nowUtc = context.requestDateTime.getTime()
  const isValidNow = nowUtc >= validFromDate && nowUtc <= validToDate

  // TODO: confirm validToDate is not too far in future - i.e. <= AUTH_TOKEN_MAX_EXPIRATION_IN_SECONDS

  if (!isValidNow) {
    const msg = `Auth Token has expired on ${new Date(validToDate)} or is not valid at the current time: ${
      context.requestDateTime
    }.`
    throw new ServiceError(msg, ErrorType.AuthTokenValidation, `validateAuthTokenAndExtractContents`)
  }

  // VERIFY: payloadHash matches hash of request body
  if (payloadHash) {
    const body = JSON.stringify(requestBody || '')
    const hashOfBody = createSha256Hash(body)
    if (hashOfBody !== payloadHash) {
      const msg = `Auth Token payloadHash does not match Sha256Hash of request body.`
      throw new ServiceError(msg, ErrorType.AuthTokenValidation, `validateAuthTokenAndExtractContents: ${body}`)
    }
  }

  // TODO: Check authTokens table to make sure this token hasn't already been used

  // Save authToken to prevent replay
  const base64EncodedAuthToken = encryptedAuthToken || Base64.encode(JSON.stringify(decryptedAuthToken))
  await saveAuthToken({ authToken: decryptedAuthToken, context, base64EncodedAuthToken })
  return decryptedAuthToken
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
  const { analytics, appId } = context

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

  analytics.event('api', AnalyticsEvent.AuthTokenCreated, { appId })
}
