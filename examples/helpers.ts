import { Base64 } from "js-base64";
import { sha256 } from "js-sha256";
import { Crypto } from "@open-rights-exchange/chainjs";

/** 
 *  Create and encode the authToken needed for each request 
 *  The whole token is encrypted (with the server's publicKey and) and then base64 encoded
 *  We can include secrets here and set an expiration time (in validTo)
*/
export async function createAuthToken(url: string, payloadBody: any, publicKey: string, secrets?: any, returnRawAuthToken = false) {
  // hash the body of the request
  const payloadHash = payloadBody ? createSha256Hash(JSON.stringify(payloadBody)): null;
  const now = new Date();
  const token = {
    url,
    payloadHash,
    validFrom: now,
    validTo: new Date(now.getTime() + 1000 * 60 * 2), // 2 mins from now
    secrets: secrets || {}, 
  };
  
  if(returnRawAuthToken) return token

  // encrypt with public key of service
  const encrypted = Crypto.Asymmetric.encryptWithPublicKey(
    publicKey,
    JSON.stringify(token),
  );
  return Base64.encode(JSON.stringify(encrypted));
}

/** 
 *  Create and encode a payload which includes an encrypted data item AND and authToken governing its use
 *  The contents of the payload are: { encrypted: EncryptedDataString, authToken: AuthToken }
 *  The contents are stringified, encrypted (with the server's publicKey), then that encrypted string is base64 encoded
*/
export async function createEncryptedAndAuthToken(url: string, encrypted: any, servicePublicKey: string, secrets?: any, returnRawAuthToken = false) {
  const encryptedPayloadAuthToken = await createAuthToken(url, encrypted, servicePublicKey, secrets, true )
  const encryptedAndAuthTokenString = JSON.stringify({encrypted, authToken: encryptedPayloadAuthToken})
  const encryptedToken = Crypto.Asymmetric.encryptWithPublicKey(servicePublicKey, encryptedAndAuthTokenString)
  return Base64.encode(JSON.stringify(encryptedToken));
}

/** Generates a SHA256 hash from a value
 *  Returns a hex-encoded result */
export function createSha256Hash(value: string) {
  const hash = sha256.create();
  hash.update(value);
  return hash.hex();
}
