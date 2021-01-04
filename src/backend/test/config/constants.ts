import { Constants } from "../../../models"

// const fs = require('fs')
// const dotenv = require('dotenv')
// const path = require('path')
// const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.test')))

declare let global: any

// /////////////////////// /// //
// SET UP FOR ALL THE TESTS    //
// /////////////////////// /// //

// if a variable is declared as global, it can be used across the entire test suite
// The following account keys are not used in production...

// NOTE: All keys in this file should be unique, and should not exist anywhere else
// NOTE: So, when adding new keys, make sure to generate them, and not copy/paste

// const settings = process.env

/** Constants used to initalize service */
export const CONSTANTS: Constants = {
  ENVIRONMENT: 'test',
  APP_NAME: 'crypto-service-test',
  MONGO_TIMEOUT: 15000,
  DEFAULT_PROCESS_ID: 'TEST_CONTEXT_PROCESS_ID_MISSING',
  ROLLBAR_POST_WRITE_SERVER_KEY: "b4bbd88834be41ea82c4afeffd2d03be", // staging key
  SEGMENT_WRITE_KEY: "ujit62E4bjl4CNjgRqDcdBAr8gzfJ7k1", // staging key
  BASE_PUBLIC_KEY: "04cea2c951504b5bfefa78480ae632da2c7889561325f9d76ca7b0a1e62f7a8cd52ce313c8b3fd3c7ffe2f588322e5be331c64b31b256a8769e92f947ae712b761",
  BASE_PRIVATE_KEY: "720d62b5dba86d798c4ec200df7d7937451b4d24a7c5227f0e8df1905f6af5c8",
  // Invalid PIN Attempt
  MINUTES_FOR_FIRST_LOCK: 1,
  MINUTES_FOR_SECOND_LOCK: 15,
  MINUTES_FOR_MORE_LOCK: 60,
  HOURS_FOR_TIMEOUT_LOCK: 24,
  // Misc
  APP_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: 120,
}

export function setupGlobalConstants() {
  // General
  global.BASE_PUBLIC_KEY = CONSTANTS.BASE_PUBLIC_KEY
  global.BASE_PRIVATE_KEY = CONSTANTS.BASE_PRIVATE_KEY
  // TEST ONLY
  global.TEST_API_ENDPOINT = 'http://localhost:8080'
  global.EOS_KYLIN_CHAIN_ID = '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191'
  global.EOS_KYLIN_URL = 'https://api.kylin.alohaeos.com:443'
  global.processId = 'abc14c84571d'
  global.TEST_APP_API_KEY = "t_k00000-0000-0000-0000-0000000000"
  global.TEST_APP_APPID = "00000000-0000-0000-0000-0000000000"
  global.NOW_DATE = new Date('2021-01-04T05:31:39.208Z')
}

setupGlobalConstants()
