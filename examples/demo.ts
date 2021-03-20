// This example demonstrates common patterns of how a client would use the cryto service
import axios from "axios";
import {
  Chain,
  ChainFactory,
  ChainType,
  Crypto,
} from "@open-rights-exchange/chainjs";
import { encryptWithTransportKey } from './helpers';
import { Asymmetric } from "@open-rights-exchange/chainjs/dist/crypto";

require("dotenv").config();

// address of a service you trust
const serviceUrl = "https://api.crypto-service.io";
// a well-known public key of the serivce you trust
const servicePublicKey = "0478abef41d3827ae774917e82019e950f3dc41f2ac13e6671aab10dcae9b7b5cbdcfd6be2a7f84830fd0686ce0c855076091f91b102b6dbf9e29162c424c2595c";

// Localhost
// const serviceUrl = "http://localhost:8080";
// const servicePublicKey = "04cea2c951504b5bfefa78480ae632da2c7889561325f9d76ca7b0a1e62f7a8cd52ce313c8b3fd3c7ffe2f588322e5be331c64b31b256a8769e92f947ae712b761";

// sample key pairs used for having the service asymetrically encrypt a result before returning it (and signing with)
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
 * Get a public key from the service to use to encrypt data sent to the service
 *  this 'transport public key' is valid for a short time (2 mins)
 * The response from the service includes a signature which is the nonce param signed by the service's well-known base key
 * The signature should be verified by the client to ensure that the responding server is the one expected
*/
async function getTransportKey( nonce: string) {
  console.log("--------------- getTransportKey -------------->");
  const apiUrl = `${serviceUrl}/get-transport-key`
  const { data } = await axios.post(apiUrl, { nonce }, { headers } );
  const { signature, transportPublicKey } = data || {}
  console.log("get-transport-key:", data);
  const signedWithWellKnownPublicKey = Asymmetric.verifySignedWithPublicKey(nonce, servicePublicKey, signature)
  if(!signedWithWellKnownPublicKey) {
    throw new Error(`Service could not verify control of well-known public key. Are you using the right endpoint? Well-known PublicKey expected: ${servicePublicKey}`)
  }
  return transportPublicKey
}

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
 * Generate new blockchain keys - they are encrypted before being returned (with the password we included in symmetricOptions.transportEncryptedPassword) 
 */
async function generateKeys( chainJs: Chain, transportPublicKey: string ) {
  console.log("--------------- generateKeys -------------->");
  const apiUrl = `${serviceUrl}/generate-keys`
  const generateKeyParams = {
    chainType: chainJs.chainType,
    symmetricOptions: symmetricAesOptions,
    asymmetricOptions: [{
      "publicKeys" : [ ethPubKey ]
    }],
    transportPublicKey,
  };
  const transportEncryptedPassword = await encryptWithTransportKey( myPassword, transportPublicKey );
  generateKeyParams.symmetricOptions.transportEncryptedPassword = transportEncryptedPassword;
  const { data } = await axios.post(apiUrl, generateKeyParams, { headers } );
  console.log("generate-keys results:", data);
  // The new keys are encrypted with your password, decrypt and display them
  const newPublicKey = data[0].publicKey;
  const encryptedPrivateKey = data[0].symmetricEncryptedString;
  const newPrivateKey = chainJs.decryptWithPassword( encryptedPrivateKey, myPassword, symmetricAesOptions );
  const asymEncryptedPrivateKey = JSON.parse(data[0].asymmetricEncryptedStrings[0])[0];
  const decryptedPrivateKey = await chainJs.decryptWithPrivateKey(asymEncryptedPrivateKey, ethPrivateKey);
  console.log("Decrypted New Public key:", newPublicKey);
  console.log("Decrypted New Private key:", newPrivateKey);
  console.log("Decrypted Asym Private Key", decryptedPrivateKey)
}

/** 
 *  Use the service to encrypt a string. Then, decrypt the returned result using the private key matching the asymmetricOptions.publicKey(s)
 *  Result from Encrypt endpoint can include more than one encrypted payload 
 *  Since symmetricOptions.transportEncryptedPassword is provided, result includes symmetricEncryptedString (encrypted with the password)
 *  If asymmetricOptions is provided, then result includes asymmetricEncryptedString (encrypted with one or more public keys provided)
 */
async function encryptAndDecryptString( stringToEncrypt: string, transportPublicKey: string ) {
  console.log("--------------- encryptAndDecryptString -------------->");
  const apiUrl = `${serviceUrl}/encrypt`;
  const ethChain = new ChainFactory().create(ChainType.EthereumV1, [{ url: null }]);
  const encryptParams = {
    chainType: "ethereum",
    toEncrypt: stringToEncrypt,
    asymmetricOptions: [{
      "publicKeys" : [ ethPubKey ]
    }],
    symmetricOptions: symmetricAesOptions,
    transportPublicKey,
  };
  const transportEncryptedPassword = await encryptWithTransportKey( myPassword, transportPublicKey );
  encryptParams.symmetricOptions.transportEncryptedPassword = transportEncryptedPassword;
  const { data } = await axios.post(apiUrl, encryptParams, { headers } );
  console.log("encrypted results:", data);
  
  // results are encrypted with our public key, so we can decrypt it with the matching private key
  
  const encryptedString = JSON.parse(data.asymmetricEncryptedStrings[0])[0];
  const decryptedString = await ethChain.decryptWithPrivateKey( encryptedString, ethPrivateKey );
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
async function decryptWithPrivateKey( stringToEncrypt: string, transportPublicKey: string ) {
  console.log("--------------- decryptWithPrivateKey -------------->");
  const apiUrl = `${serviceUrl}/decrypt-with-private-keys`
  const algoChain = new ChainFactory().create(ChainType.AlgorandV1, [{ url: null }]);
  const decryptWPrivateKeyParams: any = {
    chainType: "algorand",
    symmetricOptionsForEncryptedPrivateKeys: symmetricEd25519Options,
    returnAsymmetricOptions: [{
      "publicKeys" : [ algoPubKey ]
    }],
    transportPublicKey,
  }
  // -- Option 1: encrypt our private key symmetrically (using our password)
  // decryptWPrivateKeyParams.symmetricEncryptedPrivateKeys = [algoChain.encryptWithPassword(algoPrivateKey, myPassword, symmetricAesOptions)]

  // -- Option 2: Encrypt our private key asymmetrically
  const encryptedPrivateKey = JSON.stringify([Crypto.Asymmetric.encryptWithPublicKey(servicePublicKey, algoPrivateKey)])
  decryptWPrivateKeyParams.asymmetricTransportEncryptedPrivateKeys = await encryptWithTransportKey(encryptedPrivateKey, transportPublicKey)

  // encrypt a payload using our associated public key
  const encrypted = await algoChain.encryptWithPublicKey(stringToEncrypt, algoPubKey)
  decryptWPrivateKeyParams.encrypted = encrypted

  const transportEncryptedPassword = await encryptWithTransportKey( myPassword, transportPublicKey );
  decryptWPrivateKeyParams.symmetricOptionsForEncryptedPrivateKeys.transportEncryptedPassword = transportEncryptedPassword
  const { data } = await axios.post(apiUrl, decryptWPrivateKeyParams, { headers } );
  console.log('data:', data)
  // results are encrypted with our public key, so we can decrypt it with the matching private key
  const encryptedString = algoChain.toAsymEncryptedDataString(JSON.stringify(JSON.parse(data.asymmetricEncryptedStrings[0])[0]))
  const decryptedString = await algoChain.decryptWithPrivateKey( encryptedString, algoPrivateKey );
  console.log("Decrypted string:", decryptedString);
}

/** 
 *  Use the service to decrypt a payload using private keys that are encrypted with the transport public key
 *  and then have it re-encrypt the payload using new symmetric and/or asymmetric options
 *  The encrypted payload is wrapped with a transport public key
 *  ...encryptedTransportEncrypted is the encrypted value that is wrapped with the transport public key
 */
async function recoverAndReencrypt( prviateKeyToEncrypt: string, transportPublicKey: string ) {
  console.log("--------------- recoverAndReencrypt -------------->");
  const apiUrl = `${serviceUrl}/recover-and-reencrypt`
  const algoChain = new ChainFactory().create(ChainType.AlgorandV1, [{ url: null }]);
  const recoverAndReencryptParams: any = {
    chainType: "algorand",
    symmetricOptionsForReencrypt: symmetricEd25519Options,
    asymmetricOptionsForReencrypt: [{
      "publicKeys" : [ algoPubKey ]
    }],
    transportPublicKey,
  }
  // encrypt a payload using our public key - in this example, its a private key we've 'backed-up'
  const privateKeyToRecover = await algoChain.encryptWithPublicKey(prviateKeyToEncrypt, algoPubKey)
  // wrap the encrypted payload with the transport public key
  recoverAndReencryptParams.encryptedTransportEncrypted = await encryptWithTransportKey(privateKeyToRecover, transportPublicKey)
  // encrypt the private keys we'll use to decrypt the privateKeyToRecover
  const encryptedPrivateKey = JSON.stringify(Crypto.Asymmetric.encryptWithPublicKey(servicePublicKey, algoPrivateKey))

  // wrap the encrypted keys with the transport public key
  recoverAndReencryptParams.asymmetricTransportEncryptedPrivateKeys = await encryptWithTransportKey(encryptedPrivateKey, transportPublicKey)
  // wrap password with the transport public key
  recoverAndReencryptParams.symmetricOptionsForReencrypt.transportEncryptedPassword = await encryptWithTransportKey( myPassword, transportPublicKey );
  
  const { data } = await axios.post(apiUrl, recoverAndReencryptParams, { headers } );
  console.log('response from api/recover-and-reencrypt:', data)

  // newly encrypted results are encrypted with our public key, so we can decrypt it with the matching private key
  const encryptedString = algoChain.toAsymEncryptedDataString(JSON.stringify(JSON.parse(data.asymmetricEncryptedStrings[0])[0]))
  const decryptedString = await algoChain.decryptWithPrivateKey( encryptedString, algoPrivateKey );
  const symDecryptedString = algoChain.decryptWithPassword(data.symmetricEncryptedString, myPassword, symmetricEd25519Options)
  console.log("Decrypted string:", decryptedString);
  console.log("Decrypted string:", symDecryptedString);
}

/**
 *  Use the service to generate a signature from a string.
 *  The signature is compliant with the block chain specified (e.g. ethereum)
 *  */
async function sign( chainJs: Chain, toSign: string, privateKey: string, transportPublicKey: string ) {
  console.log(`--------------- sign for chain ${chainJs.chainType}-------------->`);
  const apiUrl = `${serviceUrl}/sign`
  // encrypt our private key with our password - the service will decrypt it (and sign with it) using the same password (sent via transportEncryptedPassword)
  const signParams: any = {
    chainType: chainJs.chainType,
    toSign,
    transportPublicKey,
  }

  // -- Option 1: Use Symmetrically encrypted private keys
  signParams.symmetricOptions = symmetricAesOptions
  signParams.symmetricEncryptedPrivateKeys = [chainJs.encryptWithPassword(privateKey, myPassword, symmetricAesOptions)]

  const transportEncryptedPassword = await encryptWithTransportKey( myPassword, transportPublicKey );
  signParams.symmetricOptions.transportEncryptedPassword = transportEncryptedPassword;

  // -- Option 2: Use Asymmetrically encrypted private keys
  // const encryptedPrivateKey = JSON.stringify([Crypto.Asymmetric.encryptWithPublicKey(servicePublicKey, privateKey)])
  // signParams.asymmetricTransportEncryptedPrivateKeys = await encryptWithTransportKey(encryptedPrivateKey, transportPublicKey)
  
  const { data } = await axios.post(apiUrl, signParams, { headers } );
  console.log("sign results:", JSON.stringify(data[0]));
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
    // Generate new blockchain keys - they are encrypted before being returned (with the password we include in symmetricOptions)
    await verifyPublicKey('unique-nonce')
    const transportPublicKey = await getTransportKey('unique-nonce') // hint: use unqiue guid
    await generateKeys(ethChain, transportPublicKey)
    // Use /encrypt to encrypt on the server
    await encryptAndDecryptString('encrypt-this-string', transportPublicKey)
    await decryptWithPrivateKey('private-message-decrypted-by-service', transportPublicKey )
    await recoverAndReencrypt('private-key-to-recover', transportPublicKey )
    await sign(ethChain, '0xff703f9324c38fbb991ad56446990bc65b8d915fdf731bb0e9d8c3967bd7ef18', ethPrivateKey, transportPublicKey)
    await sign(eosChain, '0xff703f9324c38fbb991ad56446990bc65b8d915fdf731bb0e9d8c3967bd7ef18', eosPrivateKey, transportPublicKey)
    await sign(algoChain, '0xff703f9324c38fbb991ad56446990bc65b8d915fdf731bb0e9d8c3967bd7ef18', algoPrivateKey, transportPublicKey)
  } catch (error) {
    console.log(error);
  }
}
