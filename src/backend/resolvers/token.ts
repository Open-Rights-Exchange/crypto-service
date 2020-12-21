import { NextFunction, Request, Response } from 'express'
import { isNullOrEmpty, isValidDate, tryBase64Decode } from 'aikon-js'
import { convertStringifiedJsonOrObjectToObject, createSha256Hash } from '../utils/helpers'
import { AppId, AuthToken, Context } from '../models'
import { decryptWithBasePrivateKey } from './crypto'

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
  const encryptedAuthToken = tryBase64Decode(req.headers['auth-token'] as string)
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
  if (!isValidNow) {
    throw new Error(`Auth Token has expired or is not valid at the current time: ${now}.`)
  }

  // VERIFY: payloadHash matches hash of request body
  const bodyStringified = JSON.stringify(req.body || '')
  const hashOfBody = createSha256Hash(bodyStringified)
  if (hashOfBody !== payloadHash) {
    throw new Error(`Auth Token payloadHash does not match Sha256Hash of request body.`)
  }

  // TODO: Save authToken to prevent replay

  // Return decoded token
  const authToken: AuthToken = {
    payloadHash,
    validFrom: new Date(validFrom),
    validTo: new Date(validTo),
    secrets,
  }

  return authToken
}
