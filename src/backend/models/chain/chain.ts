import { Asymmetric, AesCrypto, Ed25519Crypto } from './index'

type AsymmetricEncryptedString = Asymmetric.AsymmetricEncryptedDataString
type AsymmetricEncryptionOptions = Asymmetric.EciesOptions
type AsymmetricEncryptedData = Asymmetric.AsymmetricEncryptedData
type SymmetricEncryptedString = AesCrypto.AesEncryptedDataString | Ed25519Crypto.Ed25519EncryptedDataString
type SymmetricEncryptedData = AesCrypto.AesEncryptedData | Ed25519Crypto.Ed25519EncryptedData
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
