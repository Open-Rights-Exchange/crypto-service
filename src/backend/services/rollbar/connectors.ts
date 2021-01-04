import Rollbar from 'rollbar'
import { Constants } from '../../../models'
import { CONSTANTS } from '../../constants'

let rollbar: Rollbar
let currentConstants: Constants

export function getRollbar(constants: Constants): Rollbar {
  // fallback to service settings if we dont have constants loaded - this is just in case we have an untrappable error
  const writeKey = constants?.ROLLBAR_POST_WRITE_SERVER_KEY || CONSTANTS.ROLLBAR_POST_WRITE_SERVER_KEY
  const environment = constants?.ENVIRONMENT || CONSTANTS.ENVIRONMENT
  if (rollbar && constants === currentConstants) return rollbar

  const rollbarConfig = {
    accessToken: writeKey,
    captureUncaught: true,
    captureUnhandledRejections: true,
    payload: {
      environment,
    },
  }
  rollbar = new Rollbar(rollbarConfig)
  if (constants) currentConstants = constants
  return rollbar
}
