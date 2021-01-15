import { Constants } from "../../../models"
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const envFile = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.test')))

declare let global: any

// /////////////////////// /// //
// SET UP FOR ALL THE TESTS    //
// /////////////////////// /// //

// if a variable is declared as global, it can be used across the entire test suite
// The following account keys are not used in production...

// NOTE: All keys in this file should be unique, and should not exist anywhere else
// NOTE: So, when adding new keys, make sure to generate them, and not copy/paste

/** Constants used to initalize service */
export const CONSTANTS: Constants = {
  ENVIRONMENT: 'test',
  APP_NAME: 'crypto-service-test',
  MONGO_TIMEOUT: 15000,
  DEFAULT_PROCESS_ID: 'TEST_CONTEXT_PROCESS_ID_MISSING',
  ROLLBAR_POST_WRITE_SERVER_KEY: envFile.ROLLBAR_POST_WRITE_SERVER_KEY,
  SEGMENT_WRITE_KEY: envFile.SEGMENT_WRITE_KEY,
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
  global.TEST_EXPRESS_SERVER_PORT = 8085
  global.TEST_SERVER_PATH = `http://127.0.0.1:${global.TEST_EXPRESS_SERVER_PORT}`
  global.ETH_PUB_KEY = "0xc68e0f87e57569a1a053bba68ecde6a55c19d93a3e1ab845be60b2828991b3de30d74a9fdd9602d30434376ef1e922ffdbc61b4ea31a8c8c7427b935337e82d6";
  global.ETH_PPRIVATE_KEY = "5f8b66eea19b59c7a477142fb7204d762e2d446e98334101e851fd0e1ccff318";
  global.EOS_PUB_KEY = "EOS7s6kUmgMjDSekrUiB9ynZEMb8qxaBNTAZMaUCyZ1n939aa6RcK";
  global.EOS_PRIVATE_KEY = "5JWN61TdVxQMpBzW1oCeQhFxC7DAm62feXcKXHcipHwGU7Xj36W";
  global.ALGO_PUB_KEY = "1e36f5b07eab1c326de0218ea5bf9c68ce5a9d4bcfbe40ffe0b96ee81fb98fab";
  global.ALGO_PRIVATE_KEY = "68c7d4579c891145a23deb3c8393810a5501dd1e41c09be56e23f2bec4e4e9681e36f5b07eab1c326de0218ea5bf9c68ce5a9d4bcfbe40ffe0b96ee81fb98fab";
  global.MY_PASSWORD = "my-secure-password";
  global.SYMMETRIC_AES_OPTIONS = {
    salt: "my-salt",
    iter: 50000,
  } as any;
  global.SYMMETRIC_ED25519_OPTIONS = {
    salt: "my-salt",
  } as any;
  // General
  global.BASE_PUBLIC_KEY = CONSTANTS.BASE_PUBLIC_KEY
  global.BASE_PRIVATE_KEY = CONSTANTS.BASE_PRIVATE_KEY
  // TEST ONLY
  global.TEST_API_ENDPOINT = 'http://localhost:8080'
  global.EOS_KYLIN_CHAIN_ID = '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191'
  global.EOS_KYLIN_URL = 'https://api.kylin.alohaeos.com:443'
  global.processId = 'abc123-testrunner'
  global.TEST_APP_API_KEY = "t_k00000-0000-0000-0000-0000000000"
  global.TEST_APP_APPID = "00000000-0000-0000-0000-0000000000"
  global.NOW_DATE = new Date('2021-01-04T05:31:39.208Z')
}

setupGlobalConstants()
