import { ChainFactory, Chain } from '@open-rights-exchange/chainjs'
import { AppId, ChainPlatformType, Context, ChainType } from '../models'
import { ChainFunctions as AlgorandCustomFunctions } from './algorand'
import { ChainFunctions as EthereumCustomFunctions } from './ethereum'
import { ChainFunctions as EosChainFunctions } from './eos'
import { IChainFunctions } from './IChainFunctions'
/** A stateful wrapper for a blockchain connection
 *  Includes context and appRegistation settings */
export class ChainConnection {
  private _appId: string
  private _context: Context
  private _chainFunctions: IChainFunctions
  private _chainType: ChainType
  private _chain: Chain
  private _chainPlatform: ChainPlatformType

  constructor(chainType: ChainType) {
    this._chainType = chainType
    this._chainFunctions = ChainConnection.getChainFunctions(chainType)
    this._chainPlatform = ChainConnection.getChainPlatformFromType(chainType)
    this._chain = new ChainFactory().create(this._chainType, null, {})
  }

  /** Load app setings and (by default) connect to the chain to confirm the endpoint is up */
  async initialize(context?: Context, appId?: AppId): Promise<void> {
    this._context = context
    this._appId = appId
  }

  /** AppId for active app */
  get appId() {
    return this._appId
  }

  /** Access to underlying chain funcitons */
  get chain() {
    return this._chain
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
    throw new Error(`Chain ${this.chainType} does not support ${description}`)
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
    throw new Error(`Chain type ${chainType} not implemented`)
  }

  /** Determines the custom oreid code to use for each ChainNetwork */
  static getChainFunctions(chainType: ChainType): IChainFunctions {
    if (chainType === ChainType.AlgorandV1) {
      return AlgorandCustomFunctions
    }
    if (chainType === ChainType.EthereumV1) {
      return EthereumCustomFunctions
    }
    if (chainType === ChainType.EosV2) {
      return EosChainFunctions
    }
    throw new Error(`getChainFunctions: Chaintype ${chainType} not implemented`)
  }
}

/** Returns a ChainConnection - does not connect to the blockchain endpoint */
export async function getChain(
  chainType: ChainType,
  context?: Context,
  appId?: AppId,
  connectImmediately = false,
): Promise<ChainConnection> {
  const chainConnection = new ChainConnection(chainType)
  await chainConnection.initialize(context, appId)
  return chainConnection
}
