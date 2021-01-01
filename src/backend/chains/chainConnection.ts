import { ChainFactory, Chain, ChainType as ChainTypeChainJs } from '@open-rights-exchange/chainjs'
import { AppId, ChainPlatformType, Context, ChainType, ErrorType } from '../models'
import { ServiceError } from '../resolvers/errors'
import { ChainFunctionsAlgorand } from './algorand'
import { ChainFunctionsEthereum } from './ethereum'
import { ChainFunctionsNoChain } from './_noChain'
import { ChainFunctionsEos } from './eos'
import { ChainFunctions } from './ChainFunctions'
import { toEnumValue } from '../helpers'
/** A stateful wrapper for a blockchain connection
 *  Includes context and appRegistation settings */
export class ChainConnection {
  private _appId: AppId

  private _context: Context

  private _chainFunctions: ChainFunctions

  private _chainType: ChainType

  private _chainPlatform: ChainPlatformType

  constructor(chainType: ChainType) {
    this._chainType = chainType
    this._chainPlatform = ChainConnection.getChainPlatformFromType(chainType)
    const chain =
      chainType !== ChainType.NoChain
        ? new ChainFactory().create(toEnumValue(ChainTypeChainJs, this._chainType), null, {})
        : null
    this._chainFunctions = ChainConnection.getChainFunctions(chainType, chain)
  }

  /** Load app setings and (by default) connect to the chain to confirm the endpoint is up */
  async initialize(context?: Context): Promise<void> {
    this._context = context
    this._appId = context?.appId
  }

  /** AppId for active app */
  get appId() {
    return this._appId
  }

  /** Custom oreid code for this chain */
  get chainFunctions() {
    return this._chainFunctions
  }

  /** Chain network type (e.g. ore_main) */
  get chainType() {
    return this._chainType
  }

  /** Authenticated user context */
  get context() {
    return this._context
  }

  isChainType(chainType: ChainType): boolean {
    return chainType === this.chainType
  }

  /** Chain technology type (e.g. EOS Version 2.0) */
  get platformType() {
    return this._chainPlatform
  }

  throwNotSupported(description: string) {
    const msg = `Chain ${this.chainType} does not support ${description}`
    throw new ServiceError(msg, ErrorType.ChainConfig, 'chainConnection')
  }

  /** Determines the ChainJS ChainType to use for a given the current platformType */
  static getChainPlatformFromType(chainType: ChainType) {
    if (chainType === ChainType.AlgorandV1) {
      return ChainPlatformType.Algorand
    }
    if (chainType === ChainType.EosV2) {
      return ChainPlatformType.Eos
    }
    if (chainType === ChainType.EthereumV1) {
      return ChainPlatformType.Ethereum
    }
    if (chainType === ChainType.NoChain) {
      return ChainPlatformType.NoPlatform
    }
    const msg = `Chain type ${chainType} not implemented`
    throw new ServiceError(msg, ErrorType.ChainConfig, 'getChainPlatformFromType')
  }

  /** Determines the custom oreid code to use for each ChainNetwork */
  static getChainFunctions(chainType: ChainType, chain: Chain): ChainFunctions {
    if (chainType === ChainType.AlgorandV1) {
      return new ChainFunctionsAlgorand(chain)
    }
    if (chainType === ChainType.EthereumV1) {
      return new ChainFunctionsEthereum(chain)
    }
    if (chainType === ChainType.EosV2) {
      return new ChainFunctionsEos(chain)
    }
    if (chainType === ChainType.NoChain) {
      return new ChainFunctionsNoChain(chain)
    }
    const msg = `getChainFunctions: Chaintype ${chainType} not implemented`
    throw new ServiceError(msg, ErrorType.ChainConfig, 'getChainFunctions')
  }
}

/** Returns a ChainConnection - does not connect to the blockchain endpoint */
export async function getChain(
  chainType: ChainType,
  context?: Context,
  connectImmediately = false,
): Promise<ChainConnection> {
  const chainConnection = new ChainConnection(chainType)
  await chainConnection.initialize(context)
  return chainConnection
}
