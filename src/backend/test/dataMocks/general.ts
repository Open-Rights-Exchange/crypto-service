import { CONSTANTS } from '../config/constants'
import { Logger } from '../../../helpers'
import { Context } from '../../../models'
import { Analytics } from '../../services/segment/resolvers'

declare let global: any

export const createContext = (appId?: string): Context => {
  return {
    analytics: new Analytics(CONSTANTS.SEGMENT_WRITE_KEY, global.processId),
    appId: appId || global.TEST_APP_APPID,
    constants: CONSTANTS,
    logger: new Logger({ rollbar: null, processId: global.processId, tracingEnabled: false }),
    processId: global.processId,
    requestDateTime: global.NOW_DATE,
  }
}
