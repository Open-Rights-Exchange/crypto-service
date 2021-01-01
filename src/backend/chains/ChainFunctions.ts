import { Chain } from '@open-rights-exchange/chainjs'
import { toEnumValue } from '../helpers'
import { Asymmetric, ChainType, CryptoCurve, GenericCrypto, KeyPair, PrivateKey, PublicKey } from '../models'

class ChainFunctions {
  private _chain: Chain

  constructor(chain: Chain) {
    this._chain = chain
  }

  // --------- Chain crytography functions */
  /** Primary cryptography curve used by this chain */
  public get cryptoCurve(): CryptoCurve {
    return this._chain.cryptoCurve
  }

  /** Returns chain type enum - resolves to chain family as a string e.g. 'eos' */
  public get chainType(): ChainType {
    return toEnumValue(ChainType, this._chain.chainType)
  }

  /** Decrypts the encrypted value using a password, and optional salt using AES algorithm and SHA256 hash function
   * Expects the encrypted value to be a stringified JSON object */
  decryptWithPassword(encrypted: GenericCrypto.SymmetricEncryptedDataString, password: string, options?: any): string {
    return this._chain.decryptWithPassword(encrypted, password, options)
  }

  /** Encrypts a string using a password and optional salt using AES algorithm and SHA256 hash function
   * The returned, encrypted value is a stringified JSON object */
  encryptWithPassword(
    unencrypted: string,
    password: string,
    options?: any,
  ): GenericCrypto.SymmetricEncryptedDataString {
    return this._chain.encryptWithPassword(unencrypted, password, options)
  }

  /** Decrypts the encrypted value using a private key
   * The encrypted value is a stringified JSON object
   * ... and must have been encrypted with the public key that matches the private ley provided */
  decryptWithPrivateKey(
    encrypted: Asymmetric.AsymmetricEncryptedDataString,
    privateKey: PrivateKey,
    options?: any,
  ): Promise<string> {
    return this._chain.decryptWithPrivateKey(encrypted, privateKey, options)
  }

  /** Encrypts a string using a public key into a stringified JSON object
   * The encrypted result can be decrypted with the matching private key */
  encryptWithPublicKey(
    unencrypted: string,
    publicKey: PublicKey,
    options?: any,
  ): Promise<Asymmetric.AsymmetricEncryptedDataString> {
    return this._chain.encryptWithPublicKey(unencrypted, publicKey, options)
  }

  /** Encrypts a string by wrapping it with successive asymmetric encryptions with multiple public key
   *  Operations are performed in the order that the public keys appear in the array
   *  Only the last item has the final, wrapped, ciphertext
   *  The encrypted result can be decrypted with the matching private keys in the inverse order */
  encryptWithPublicKeys(
    unencrypted: string,
    publicKeys: PublicKey[],
    options?: any,
  ): Promise<Asymmetric.AsymmetricEncryptedDataString> {
    return this._chain.encryptWithPublicKeys(unencrypted, publicKeys, options)
  }

  /** Unwraps an object produced by encryptWithPublicKeys() - resulting in the original ecrypted string
   *  each pass uses a private keys from privateKeys array param
   *  put the keys in the same order as public keys provided to encryptWithPublicKeys() - they will be applied in the right (reverse) order
   *  The result is the decrypted string */
  decryptWithPrivateKeys(
    encrypted: Asymmetric.AsymmetricEncryptedDataString,
    privateKeys: PrivateKey[],
  ): Promise<string> {
    return this._chain.decryptWithPrivateKeys(encrypted, privateKeys)
  }

  /** Generates and returns a new public/private key pair */
  generateKeyPair(): Promise<KeyPair> {
    return this._chain.generateKeyPair()
  }

  /** Returns a public key given a signature and the original data was signed */
  getPublicKeyFromSignature(signature: any, data: string | Buffer, encoding: string): PublicKey {
    return this._chain.getPublicKeyFromSignature(signature, data, encoding)
  }

  /** Verifies that the value is a valid, stringified JSON encryption result */
  isAsymEncryptedDataString(value: string): boolean {
    return this._chain.isAsymEncryptedDataString(value)
  }

  /** Generate a signature given some data and a private key */
  isSymEncryptedDataString(value: string): boolean {
    return this._chain.isSymEncryptedDataString(value)
  }

  /** Verifies that the value is a valid, stringified JSON asymmetric encryption result */
  isValidPrivateKey(value: string | Buffer): boolean {
    return this._chain.isValidPrivateKey(value)
  }

  /** Verifies that the value is a valid public key for the chain */
  isValidPublicKey(value: string | Buffer): boolean {
    return this._chain.isValidPublicKey(value)
  }

  /** Generate a signature given some data and a private key */
  sign(data: string | Buffer, privateKey: string, encoding: string): any {
    return this._chain.sign(data, privateKey, encoding)
  }

  // Chain Helper functions

  /** Ensures that the value comforms to a well-formed public Key */
  toPublicKey(value: string): PublicKey {
    return this._chain.toPublicKey(value)
  }

  /** Ensures that the value comforms to a well-formed private Key */
  toPrivateKey(value: string): PrivateKey {
    return this._chain.toPrivateKey(value)
  }

  /** Ensures that the value comforms to a well-formed stringified JSON encryption result */
  toAsymEncryptedDataString(value: any): Asymmetric.AsymmetricEncryptedDataString {
    return this._chain.toAsymEncryptedDataString(value)
  }

  /** Ensures that the value comforms to a well-formed encrypted stringified JSON object */
  toSymEncryptedDataString(value: any): GenericCrypto.SymmetricEncryptedDataString {
    return this._chain.toSymEncryptedDataString(value)
  }
}

export { ChainFunctions }
