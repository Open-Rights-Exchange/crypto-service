import { Logger } from 'aikon-js'
import { Context } from '../../models'

declare let global: any

export const createContext = (appId?: string): Context => {
  return {
    appId: appId || global.TEST_APP_APPID,
    logger: new Logger({ rollbar: null, processId: global.processId, tracingEnabled: false }),
    processId: global.processId,
  }
}
