// This example demonstrates common patterns of how a client would use the cryto service

import axios from "axios";
import {
  Chain,
  ChainFactory,
  ChainType,
} from "@open-rights-exchange/chainjs";
import { createAuthToken } from './helpers';

require("dotenv").config();

// address of a service you trust
const serviceUrl = "https://api.crypto-service.io";

// a well-known public key of the serivce you trust
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
const symmetricAesOptions = {
  salt: "my-salt",
  iter: 50000,
};
const symmetricEd25519Options = {
  salt: "my-salt",
};

// api key for demo app registration
const apiKey = "t_k_demo_508258b13b334503a76fb8b9b6af3234";
const headers = { "api-key": apiKey, "Content-Type": "application/json" };


/** 
 * Generate new blockchain keys - they are encrypted before being returned (with the password we included in the authToken) 
 */
async function generateKeys( chain: Chain ) {
  console.log("--------------- generateKeys -------------->");
    const generateKeyOptions = {
      chainType: "ethereum",
      symmetricOptions: symmetricAesOptions,
    };
    const authToken = await createAuthToken( generateKeyOptions, servicePublicKey, { password: myPassword } );
    headers["auth-token"] = authToken;
    console.log('sign auth-token:', authToken)
    const { data } = await axios.post(`${serviceUrl}/generate-keys`, generateKeyOptions, { headers } );
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
  const encryptOptions = {
    chainType: "ethereum",
    toEncrypt: stringToEncrypt,
    asymmetricOptions: {
      "publicKeys" : [ ethPubKey ]
    }
  }
  const authToken = await createAuthToken( encryptOptions, servicePublicKey, null );
  headers["auth-token"] = authToken;
  const { data } = await axios.post(`${serviceUrl}/encrypt`, encryptOptions, { headers } );
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
  const decryptWPrivateKeyOptions: any = {
    chainType: "algorand",
    symmetricOptionsForEncryptedPrivateKeys: symmetricAesOptions,
    returnAsymmetricOptions: {
      "publicKeys" : [ algoPubKey ]
    }
  }
  // encrypt our private key symmetrically (using our password)
  decryptWPrivateKeyOptions.symmetricEncryptedPrivateKeys = [chain.encryptWithPassword(algoPrivateKey, myPassword, symmetricAesOptions)]
  console.log('decryptWPrivateKeyOptions.symmetricEncryptedPrivateKeys:', decryptWPrivateKeyOptions.symmetricEncryptedPrivateKeys)
  // encrypt a payload using our associated public key
  decryptWPrivateKeyOptions.encrypted = await chain.encryptWithPublicKey(stringToEncrypt, algoPubKey)

  // use service to demonstrate decrypting the payload with our encryptedPrivateKey (which the service will decrypt with our password)
  const authToken = await createAuthToken( decryptWPrivateKeyOptions, servicePublicKey,  { password: myPassword } );
  headers["auth-token"] = authToken;
  const { data } = await axios.post(`${serviceUrl}/decrypt-with-private-keys`, decryptWPrivateKeyOptions, { headers } );
  console.log('data:', data)
  // results are encrypted with our public key, so we can decrypt it with the matching private key
  // TODO: Handle if passing in bad value to chain.decryptWithPrivateKey
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
  // encrypt our private key with our password - the service will decrypt it (and sign with it) using the same password (sent via the authToken)
  const encryptedPrivateKey = chain.encryptWithPassword(privateKey, myPassword, symmetricAesOptions)
  const signOptions = {
    chainType: chain.chainType,
    toSign,
    symmetricOptions: symmetricAesOptions,
    symmetricEncryptedPrivateKeys: [encryptedPrivateKey],
  }
  const authToken = await createAuthToken( signOptions, servicePublicKey, { password: myPassword } );
  headers["auth-token"] = authToken;
  console.log('sign auth-token:', authToken)
  const { data } = await axios.post(`${serviceUrl}/sign`, signOptions, { headers } );
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
    await generateKeys(ethChain)
    // Use /encrypt to encrypt on the server
    await encryptAndDecryptString(ethChain, 'encrypt-this-string')
    await decryptWithPrivateKey(algoChain, 'private-message-decrypted-by-service' )
    await sign(ethChain, '0xff703f9324c38fbb991ad56446990bc65b8d915fdf731bb0e9d8c3967bd7ef18', ethPrivateKey)
    await sign(eosChain, '0xff703f9324c38fbb991ad56446990bc65b8d915fdf731bb0e9d8c3967bd7ef18', eosPrivateKey)
    await sign(algoChain, '0xff703f9324c38fbb991ad56446990bc65b8d915fdf731bb0e9d8c3967bd7ef18', algoPrivateKey)
  } catch (error) {
    console.log(error);
  }
}
