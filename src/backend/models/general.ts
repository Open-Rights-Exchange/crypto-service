import { Logger } from 'aikon-js'

/** Flavor of chain network */
export enum ChainPlatformType {
  algorand = 'algorand',
  eos = 'eos',
  ethereum = 'ethereum',
}

export interface Lookup {
  [key: string]: any
}

export type AppId = string

export type Context = {
  /** appId of authenticated user or agent */
  appId?: AppId
  processId: string
  logger: Logger
}
