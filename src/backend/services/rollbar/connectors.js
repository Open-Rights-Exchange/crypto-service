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

console.log('ROLLBAR_POST_WRITE_SERVER_KEY:', ROLLBAR_POST_WRITE_SERVER_KEY)

export const rollbar = new Rollbar(rollbarConfig)

export default {}
