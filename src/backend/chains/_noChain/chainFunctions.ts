import { isNullOrEmpty } from 'aikon-js'
import {
  decryptWithPrivateKeys,
  encryptWithPublicKeys,
} from '@open-rights-exchange/chainjs/dist/crypto/asymmetricHelpers'
import { Asymmetric, ChainType, CryptoCurve, GenericCrypto, KeyPair, PrivateKey, PublicKey } from '../../models'
import { notSupported } from '../../helpers'
import { ChainFunctions } from '../ChainFunctions'

/** Implement Chain Functions for 'NoChain'
 *  NoChain means we're just using generic functions that aren't chain specific
 *  The Asymmetric functions are chain-independant however, they require an uncompressed public key
 *  whereas chains usually have a particular way to format public keys (and usually compressed) */
export class ChainFunctionsNoChain extends ChainFunctions {
  // override any functions here

  public get cryptoCurve(): any {
    return notSupported('NoChain.cryptoCurve')
  }

  public get chainType(): ChainType {
    return ChainType.NoChain
  }

  decryptWithPassword(encrypted: GenericCrypto.SymmetricEncryptedDataString, password: string, options?: any): string {
    return notSupported('NoChain.decryptWithPassword')
  }

  encryptWithPassword(unencrypted: string, password: string, options?: any): any {
    return notSupported('NoChain.encryptWithPassword')
  }

  decryptWithPrivateKey(
    encrypted: Asymmetric.AsymmetricEncryptedDataString,
    privateKey: PrivateKey,
    options?: any,
  ): Promise<string> {
    return Promise.resolve(Asymmetric.decryptWithPrivateKey(JSON.parse(encrypted), privateKey, options))
  }

  encryptWithPublicKey(
    unencrypted: string,
    publicKey: PublicKey,
    options?: any,
  ): Promise<Asymmetric.AsymmetricEncryptedDataString> {
    return Promise.resolve(
      this.toAsymEncryptedDataString(JSON.stringify(Asymmetric.encryptWithPublicKey(publicKey, unencrypted, options))),
    )
  }

  // for use as param in decryptWithPrivateKeys
  private decryptWithPrivateKeyCallback(
    encrypted: Asymmetric.AsymmetricEncryptedData,
    privateKey: PrivateKey,
    options?: any,
  ): Promise<string> {
    return Promise.resolve(Asymmetric.decryptWithPrivateKey(encrypted, privateKey, options))
  }

  // for use as param in encryptWithPublicKeys
  private encryptWithPublicKeyCallback(
    unencrypted: string,
    publicKey: PublicKey,
    options?: any,
  ): Promise<Asymmetric.AsymmetricEncryptedDataString> {
    return Promise.resolve(
      this.toAsymEncryptedDataString(JSON.stringify(Asymmetric.encryptWithPublicKey(publicKey, unencrypted, options))),
    )
  }

  decryptWithPrivateKeys(
    encrypted: Asymmetric.AsymmetricEncryptedDataString,
    privateKeys: PrivateKey[],
  ): Promise<string> {
    return decryptWithPrivateKeys(this.decryptWithPrivateKeyCallback, encrypted, privateKeys, {})
  }

  encryptWithPublicKeys(
    unencrypted: string,
    publicKeys: PublicKey[],
    options?: any,
  ): Promise<Asymmetric.AsymmetricEncryptedDataString> {
    return encryptWithPublicKeys(this.encryptWithPublicKeyCallback, unencrypted, publicKeys, options)
  }

  generateKeyPair(): any {
    return notSupported('NoChain.generateKeyPair')
  }

  getPublicKeyFromSignature(signature: any, data: string | Buffer, encoding: string): any {
    return notSupported('NoChain.getPublicKeyFromSignature')
  }

  sign(data: string | Buffer, privateKey: string, encoding: string): any {
    return notSupported('NoChain.sign')
  }

  isValidPublicKey(value: string | Buffer): boolean {
    return !isNullOrEmpty(value)
  }

  toPublicKey(value: string): PublicKey {
    if (this.isValidPublicKey(value)) return value
    throw new Error(`Not a valid public key:${value}.`)
  }

  isValidPrivateKey(value: string | Buffer): boolean {
    return !isNullOrEmpty(value)
  }

  toPrivateKey(value: string): PrivateKey {
    if (this.isValidPrivateKey(value)) return value
    throw new Error(`Not a valid private key:${value}.`)
  }

  isAsymEncryptedDataString(value: string): boolean {
    return Asymmetric.isAsymEncryptedDataString(value)
  }

  toAsymEncryptedDataString(value: any): Asymmetric.AsymmetricEncryptedDataString {
    return Asymmetric.toAsymEncryptedDataString(value)
  }

  isSymEncryptedDataString(value: string): boolean {
    return notSupported('NoChain.isSymEncryptedDataString')
  }

  toSymEncryptedDataString(value: any): GenericCrypto.SymmetricEncryptedDataString {
    return notSupported('NoChain.toSymEncryptedDataString')
  }
}
