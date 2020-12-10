import { ROLLBAR_POST_WRITE_SERVER_KEY, ENVIRONMENT } from '../../constants'

const Rollbar = require('rollbar')

const rollbarConfig = {
  accessToken: ROLLBAR_POST_WRITE_SERVER_KEY,
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    environment: ENVIRONMENT,
  },
}

export const rollbar = new Rollbar(rollbarConfig)

export default {}
