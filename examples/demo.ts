// This example demonstrates common patterns of how a client would use the cryto service

import axios from "axios";
import { Base64 } from "js-base64";
import {
  Chain,
  ChainFactory,
  ChainType,
  Crypto,
} from "@open-rights-exchange/chainjs";
import { createAuthToken, createEncryptedAndAuthToken } from './helpers';
import { Asymmetric } from "@open-rights-exchange/chainjs/dist/crypto";

require("dotenv").config();

// // address of a service you trust
// const serviceUrl = "https://staging.api.crypto-service.io";
// // a well-known public key of the serivce you trust
// const servicePublicKey = "04cea2c951504b5bfefa78480ae632da2c7889561325f9d76ca7b0a1e62f7a8cd52ce313c8b3fd3c7ffe2f588322e5be331c64b31b256a8769e92f947ae712b761";

// Localhost
const serviceUrl = "http://localhost:8080";
const servicePublicKey = "04cea2c951504b5bfefa78480ae632da2c7889561325f9d76ca7b0a1e62f7a8cd52ce313c8b3fd3c7ffe2f588322e5be331c64b31b256a8769e92f947ae712b761";

// sample key paira used for having the service asymetrically encrypt a result before returning it (and signing with)
const ethPubKey = "0xc68e0f87e57569a1a053bba68ecde6a55c19d93a3e1ab845be60b2828991b3de30d74a9fdd9602d30434376ef1e922ffdbc61b4ea31a8c8c7427b935337e82d6";
const ethPrivateKey = "5f8b66eea19b59c7a477142fb7204d762e2d446e98334101e851fd0e1ccff318";
const eosPubKey = "EOS7s6kUmgMjDSekrUiB9ynZEMb8qxaBNTAZMaUCyZ1n939aa6RcK";
const eosPrivateKey = "5JWN61TdVxQMpBzW1oCeQhFxC7DAm62feXcKXHcipHwGU7Xj36W";
const algoPubKey = "1e36f5b07eab1c326de0218ea5bf9c68ce5a9d4bcfbe40ffe0b96ee81fb98fab";
const algoPrivateKey = "68c7d4579c891145a23deb3c8393810a5501dd1e41c09be56e23f2bec4e4e9681e36f5b07eab1c326de0218ea5bf9c68ce5a9d4bcfbe40ffe0b96ee81fb98fab";

// options to encrypt 
const myPassword = "my-secure-password";
const symmetricAesOptions: any = {
  salt: "my-salt",
  iter: 50000,
};
const symmetricEd25519Options: any = {
  salt: "my-salt",
};

// api key for demo app registration
const apiKey = "t_k_demo_508258b13b334503a76fb8b9b6af3234";
const headers = { "api-key": apiKey, "Content-Type": "application/json" };

/** 
 * Retrieves the service's base public key as well as a proof that it has access to the correlated private key
 * The proof is a signature - the nonce provided signed with the private key 
*/
async function verifyPublicKey( nonce: string) {
  console.log("--------------- verifyPublicKey -------------->");
  const apiUrl = `${serviceUrl}/verify-public-key`
  const { data } = await axios.post(apiUrl, { nonce }, { headers } );
  console.log("verify-public-key results:", data);
  console.log("nonce signed with public key of service?:", Asymmetric.verifySignedWithPublicKey(nonce, servicePublicKey, data?.signature));
}

/** 
 * Generate new blockchain keys - they are encrypted before being returned (with the password we included in the authToken) 
 */
async function generateKeys( chain: Chain ) {
  console.log("--------------- generateKeys -------------->");
  const apiUrl = `${serviceUrl}/generate-keys`
  const generateKeyParams = {
    chainType: "ethereum",
    symmetricOptions: symmetricAesOptions,
  };
  const passwordAuthToken = await createAuthToken( apiUrl, null, servicePublicKey, { password: myPassword } )
  generateKeyParams.symmetricOptions.passwordAuthToken = passwordAuthToken
  const authToken = await createAuthToken( apiUrl, generateKeyParams, servicePublicKey );
  headers["auth-token"] = authToken;
  console.log('sign auth-token:', authToken)
  const { data } = await axios.post(apiUrl, generateKeyParams, { headers } );
  console.log("generate-keys results:", data);
  // The new keys are encrypted with your password, decrypt and display them
  const newPublicKey = data[0].publicKey;
  const encryptedPrivateKey = data[0].symmetricEncryptedString;
  const newPrivateKey = chain.decryptWithPassword( encryptedPrivateKey, myPassword, symmetricAesOptions );
  console.log("Decrypted New Public key:", newPublicKey);
  console.log("Decrypted New Private key:", newPrivateKey);
}

/** 
 *  Use the service to encrypt a string. Then, decrypt the returned result using the private key matching the asymmetricOptions.publicKey(s)
 *  Result from Encrypt endpoint can include more than one encrypted payload 
 *  If secrets.password is provided in authToken, then result includes symmetricEncryptedString (encrypted with the password)
 *  If asymmetricOptions is provided, then result includes asymmetricEncryptedString (encrypted with one or more public keys provided)
 */
async function encryptAndDecryptString( chain: Chain, stringToEncrypt: string ) {
  console.log("--------------- encryptAndDecryptString -------------->");
  const apiUrl = `${serviceUrl}/encrypt`;
  const encryptParams = {
    chainType: "ethereum",
    toEncrypt: stringToEncrypt,
    asymmetricOptions: {
      "publicKeys" : [ ethPubKey ]
    }
  };
  const authToken = await createAuthToken( apiUrl, encryptParams, servicePublicKey, null );
  headers["auth-token"] = authToken;
  const { data } = await axios.post(apiUrl, encryptParams, { headers } );
  console.log("encrypted results:", data);
  
  // results are encrypted with our public key, so we can decrypt it with the matching private key
  const encryptedString = JSON.parse(data.asymmetricEncryptedString)[0];
  const decryptedString = await chain.decryptWithPrivateKey( encryptedString, ethPrivateKey );
  console.log("Decrypted string:", decryptedString);
}

/** 
 *  Use the service to decrypt a payload using private keys that are themselves encrypted (with our password)
 *  We'll also ask the service to re-encrypt the result using our own public key (by providing returnAsymmetricOptions)
 *  The encrypted private keys provided to the service can be encrypted with:
 *  ... a password (symmetricEncryptedPrivateKeys) ..OR..
 *  ... with the service's public key (asymmetricEncryptedPrivateKeys)
 *  If returnAsymmetricOptions is provided, then results are encrypted using the specified public key before being returned
 */
async function decryptWithPrivateKey( chain: Chain, stringToEncrypt: string ) {
  console.log("--------------- decryptWithPrivateKey -------------->");
  const apiUrl = `${serviceUrl}/decrypt-with-private-keys`
  const decryptWPrivateKeyParams: any = {
    chainType: "algorand",
    symmetricOptionsForEncryptedPrivateKeys: symmetricEd25519Options,
    returnAsymmetricOptions: {
      "publicKeys" : [ algoPubKey ]
    }
  }
  // encrypt our private key symmetrically (using our password)
  decryptWPrivateKeyParams.symmetricEncryptedPrivateKeys = [chain.encryptWithPassword(algoPrivateKey, myPassword, symmetricAesOptions)]
  console.log('decryptWPrivateKeyOptions.symmetricEncryptedPrivateKeys:', decryptWPrivateKeyParams.symmetricEncryptedPrivateKeys)
  // encrypt a payload using our associated public key
  const encrypted = await chain.encryptWithPublicKey(stringToEncrypt, algoPubKey)
  decryptWPrivateKeyParams.encrypted = encrypted

  const passwordAuthToken = await createAuthToken( apiUrl, encrypted, servicePublicKey, { password: myPassword } )
  decryptWPrivateKeyParams.symmetricOptionsForEncryptedPrivateKeys.passwordAuthToken = passwordAuthToken
  const authToken = await createAuthToken(apiUrl, decryptWPrivateKeyParams, servicePublicKey );
  headers["auth-token"] = authToken;
  const { data } = await axios.post(apiUrl, decryptWPrivateKeyParams, { headers } );
  console.log('data:', data)
  // results are encrypted with our public key, so we can decrypt it with the matching private key
  // TODO: Handle if passing in bad value to chain.decryptWithPrivateKey
  const encryptedString = chain.toAsymEncryptedDataString(JSON.stringify(JSON.parse(data.asymmetricEncryptedString)[0]))
  const decryptedString = await chain.decryptWithPrivateKey( encryptedString, algoPrivateKey );
  console.log("Decrypted string:", decryptedString);
}

/** 
 *  Use the service to decrypt a payload using private keys that are encrypted with the service's public key
 *  and then have it re-encrypt the payload using new symmetric and/or asymmetric options
 *  The encrypted payload can be wrapped with an authToken governing its use
 *  ...encryptedAndAuthTokenObject is an object that includes encrypted value and authToken - and is encrypted with the service's key
 */
async function recoverAndReencrypt( chain: Chain, prviateKeyToEncrypt: string ) {
  console.log("--------------- recoverAndReencrypt -------------->");
  const apiUrl = `${serviceUrl}/recover-and-reencrypt`

  const recoverAndReencryptParams: any = {
    chainType: "algorand",
    symmetricOptionsForEncryptedPrivateKeys: symmetricEd25519Options,
    asymmetricOptionsForReencrypt: {
      "publicKeys" : [ algoPubKey ]
    }
  }

  // encrypt a payload using our public key - in this example, its a private key we've 'backed-up'
  const privateKeyToRecover = await chain.encryptWithPublicKey(prviateKeyToEncrypt, algoPubKey)
  // wrap the encrypted payload with an authToken that governs how the service can use the payload
  recoverAndReencryptParams.encryptedAndAuthToken = await createEncryptedAndAuthToken(apiUrl, privateKeyToRecover, servicePublicKey)
  // encrypt the private keys we'll use to decrypt the privateKeyToRecover
  const encryptedPrivateKey = Crypto.Asymmetric.encryptWithPublicKey(servicePublicKey, algoPrivateKey)
  // wrap the encrypted keys with an authToken
  recoverAndReencryptParams.asymmetricEncryptedPrivateKeysAndAuthToken = await createEncryptedAndAuthToken(apiUrl, encryptedPrivateKey, servicePublicKey)
  
  // create api auth token
  const authToken = await createAuthToken(apiUrl, recoverAndReencryptParams, servicePublicKey )
  headers["auth-token"] = authToken;
  const { data } = await axios.post(apiUrl, recoverAndReencryptParams, { headers } );
  console.log('response from api/recover-and-reencrypt:', data)

  // newly encrypted results are encrypted with our public key, so we can decrypt it with the matching private key
  const encryptedString = chain.toAsymEncryptedDataString(JSON.stringify(JSON.parse(data.asymmetricEncryptedString)[0]))
  const decryptedString = await chain.decryptWithPrivateKey( encryptedString, algoPrivateKey );
  console.log("Decrypted string:", decryptedString);
}

/**
 *  Use the service to generate a signature from a string.
 *  The signature is compliant with the block chain specified (e.g. ethereum)
 *  */
async function sign( chain: Chain, toSign: string, privateKey: string ) {
  console.log(`--------------- sign for chain ${chain.chainType}-------------->`);
  const apiUrl = `${serviceUrl}/sign`
  // encrypt our private key with our password - the service will decrypt it (and sign with it) using the same password (sent via the authToken)
  const signParams: any = {
    chainType: chain.chainType,
    toSign,
    symmetricOptions: symmetricAesOptions,
  }
  // Use Symmetrically encrypted private keys
  // signParams.symmetricEncryptedPrivateKeys = [chain.encryptWithPassword(privateKey, myPassword, symmetricAesOptions)]

  // Use Asymmetrically encrypted private keys
  const encryptedPrivateKey = [Crypto.Asymmetric.encryptWithPublicKey(servicePublicKey, privateKey)]
  signParams.asymmetricEncryptedPrivateKeysAndAuthToken = await createEncryptedAndAuthToken(apiUrl, encryptedPrivateKey, servicePublicKey)
  
  const passwordAuthToken = await createAuthToken( apiUrl, toSign, servicePublicKey, { password: myPassword } )
  signParams.symmetricOptions.passwordAuthToken = passwordAuthToken
  const authToken = await createAuthToken(apiUrl, signParams, servicePublicKey );
  headers["auth-token"] = authToken;
  console.log('sign auth-token:', authToken)
  const { data } = await axios.post(apiUrl, signParams, { headers } );
  console.log("sign results:", data);
}


// trigger execution of run()
(async () => {
  try {
    await run();
  } catch (error) {
    console.log("Error:", error);
  }
  process.exit();
})();


// Examples to run 
async function run() {
  try {
    // using ethereum keys, so we'll get an eth chain object from chain-js
    const algoChain = new ChainFactory().create(ChainType.AlgorandV1, [{ url: null }]);
    const ethChain = new ChainFactory().create(ChainType.EthereumV1, [{ url: null }]);
    const eosChain = new ChainFactory().create(ChainType.EosV2, [{ url: null }]);
    // Generate new blockchain keys - they are encrypted before being returned (with the password we included in the authToken)
    await verifyPublicKey('unique-nonce')
    await generateKeys(ethChain)
    // Use /encrypt to encrypt on the server
    await encryptAndDecryptString(ethChain, 'encrypt-this-string')
    await decryptWithPrivateKey(algoChain, 'private-message-decrypted-by-service' )
    await recoverAndReencrypt(algoChain, 'private-key-to-recover' )
    await sign(ethChain, '0xff703f9324c38fbb991ad56446990bc65b8d915fdf731bb0e9d8c3967bd7ef18', ethPrivateKey)
    await sign(eosChain, '0xff703f9324c38fbb991ad56446990bc65b8d915fdf731bb0e9d8c3967bd7ef18', eosPrivateKey)
    await sign(algoChain, '0xff703f9324c38fbb991ad56446990bc65b8d915fdf731bb0e9d8c3967bd7ef18', algoPrivateKey)
  } catch (error) {
    console.log(error);
  }
}
