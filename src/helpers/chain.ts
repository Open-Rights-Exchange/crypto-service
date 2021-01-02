import { ServiceError } from './errors'
import { isInEnum } from './conversion'
import { ChainType, ErrorType } from '../models'

/** throws if chainType string isnt a valid value in ChainType enum  */
export function assertValidChainType(chainType: string): void {
  if (!isInEnum(ChainType, chainType)) {
    throw new ServiceError(`Invalid chainType: '${chainType}'.`, ErrorType.ChainConfig, `assertValidChainType`)
  }
}
