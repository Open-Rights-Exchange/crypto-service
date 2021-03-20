import { Base64 } from "js-base64";
import { sha256 } from "js-sha256";
import { Crypto } from "@open-rights-exchange/chainjs";

const DEFAULT_TOKEN_EXPIRE_IN_SECONDS = 120 // 2 mins


/** encrypt a string with a public key 
 *  The encrytped payload is a stringified JSON object which is base64 encoded
*/
export async function encryptWithTransportKey(value: string, transportPublicKey: string ) {
  // hash the body of the request
  // encrypt with public key of service
  const encrypted = Crypto.Asymmetric.encryptWithPublicKey(
    transportPublicKey,
    value,
  );
  return Base64.encode(JSON.stringify(encrypted));
}

/** Generates a SHA256 hash from a value
 *  Returns a hex-encoded result */
export function createSha256Hash(value: string) {
  const hash = sha256.create();
  hash.update(value);
  return hash.hex();
}
