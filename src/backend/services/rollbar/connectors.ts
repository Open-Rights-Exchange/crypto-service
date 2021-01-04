import Rollbar from 'rollbar'
import { Constants } from '../../../models'
import { CONSTANTS } from '../../constants'

let rollbar: Rollbar
let currentConstants: Constants

export function getRollbar(constants: Constants): Rollbar {
  // fallback to service settings if we dont have constants loaded
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
  return rollbar
}
