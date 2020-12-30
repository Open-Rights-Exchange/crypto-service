import { Crypto } from './index'

type AsymmetricEncryptedString = Crypto.Asymmetric.AsymmetricEncryptedDataString
type AsymmetricEncryptionOptions = Crypto.Asymmetric.EciesOptions
type AsymmetricEncryptedData = Crypto.Asymmetric.AsymmetricEncryptedData
type SymmetricEncryptedString =
  | Crypto.AesCrypto.AesEncryptedDataString
  | Crypto.Ed25519Crypto.Ed25519EncryptedDataString
type SymmetricEncryptedData = Crypto.AesCrypto.AesEncryptedData | Crypto.Ed25519Crypto.Ed25519EncryptedData
type SymmetricPassword = string

/** Flavor of chain network */
export enum ChainPlatformType {
  Algorand = 'algorand',
  Eos = 'eos',
  Ethereum = 'ethereum',
}

/** Supported chain types */
export enum ChainType {
  AlgorandV1 = 'algorand',
  EosV2 = 'eos',
  EthereumV1 = 'ethereum',
}

export {
  AsymmetricEncryptedString,
  AsymmetricEncryptionOptions,
  AsymmetricEncryptedData,
  SymmetricEncryptedString,
  SymmetricEncryptedData,
  SymmetricPassword,
}
