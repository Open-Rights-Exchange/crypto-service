import { ServiceError } from './errors'
import { isInEnum } from './conversion'
import { ChainType, ErrorType } from '../models'
import { ChainConnection } from '../backend/chains/chainConnection'

/** throws if chainType string isnt a valid value in ChainType enum  */
export function assertValidChainType(chainType: string): void {
  if (!isInEnum(ChainType, chainType)) {
    throw new ServiceError(`Invalid chainType: '${chainType}'.`, ErrorType.ChainConfig, `assertValidChainType`)
  }
}

/** map chainConnection's chainType to ChainType */
export function getChainTypeFromChainConnect(chainConnect: ChainConnection) {
  const { chainFunctions } = chainConnect
  return chainFunctions.chainType
}
