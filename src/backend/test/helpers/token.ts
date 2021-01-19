import { Base64 } from 'js-base64'
import { sha256 } from 'js-sha256'
import { Crypto } from '@open-rights-exchange/chainjs'

const DEFAULT_TOKEN_EXPIRE_IN_SECONDS = 120 // 2 mins

/**
 *  Create and encode the authToken needed for a request
 *  An auth token includes an expiration time (validTo) and can contain secrets
 *  The whole token is encrypted (with the server's publicKey and) and then base64 encoded
 *  if dontEncryptToken = true, the token is returned as a JSON object (not encypted and encoded)
 */
export async function createAuthToken(
  /** the date/time for the test - not the current date */
  currentTime: Date,
  url: string,
  payloadBody: any,
  publicKey: string,
  secrets?: any,
  dontEncryptToken = false,
) {
  // hash the body of the request
  const payloadHash = payloadBody ? createSha256Hash(JSON.stringify(payloadBody)) : null
  const now = new Date()
  const token = {
    url,
    payloadHash,
    validFrom: currentTime,
    validTo: new Date(currentTime.getTime() + 1000 * DEFAULT_TOKEN_EXPIRE_IN_SECONDS),
    secrets: secrets || {},
  }

  if (dontEncryptToken) return token

  // encrypt with public key of service
  const encrypted = Crypto.Asymmetric.encryptWithPublicKey(publicKey, JSON.stringify(token))
  return Base64.encode(JSON.stringify(encrypted))
}

/**
 *  Create and encode a payload which includes an encrypted data item AND and authToken governing its use
 *  The contents of the payload are: { encrypted: EncryptedDataString, authToken: AuthToken }
 *  The contents are stringified, encrypted (with the server's publicKey), then that encrypted string is base64 encoded
 */
export async function createEncryptedAndAuthToken(
  currentTime: Date,
  url: string,
  encrypted: any,
  servicePublicKey: string,
  secrets?: any,
  returnRawAuthToken = false,
) {
  const encryptedPayloadAuthToken = await createAuthToken(currentTime, url, encrypted, servicePublicKey, secrets, true)
  const encryptedAndAuthTokenString = JSON.stringify({ encrypted, authToken: encryptedPayloadAuthToken })
  const encryptedToken = Crypto.Asymmetric.encryptWithPublicKey(servicePublicKey, encryptedAndAuthTokenString)
  return Base64.encode(JSON.stringify(encryptedToken))
}

/** Generates a SHA256 hash from a value
 *  Returns a hex-encoded result */
export function createSha256Hash(value: string) {
  const hash = sha256.create()
  hash.update(value)
  return hash.hex()
}
