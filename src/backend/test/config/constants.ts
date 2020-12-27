const fs = require('fs')
const dotenv = require('dotenv')
const path = require('path')
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '.env.test')))

declare let global: any

// /////////////////////// /// //
// SET UP FOR ALL THE TESTS    //
// /////////////////////// /// //

// if a variable is declared as global, it can be used across the entire test suite
// The following account keys are not used in production...

// NOTE: All keys in this file should be unique, and should not exist anywhere else
// NOTE: So, when adding new keys, make sure to generate them, and not copy/paste

const settings = process.env

export const setupGlobalConstants = () => {
  // Temporary hack to add test env
  for (const k in envConfig) {
    process.env[k] = envConfig[k]
  }

  global.TEST_API_ENDPOINT = 'http://localhost:8080'
  global.EOS_KYLIN_CHAIN_ID = '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191'
  global.EOS_KYLIN_URL = 'https://api.kylin.alohaeos.com:443'

  // Automated Tests
  global.processId = 'abc14c84571d'
  global.TEST_APP_API_KEY = "t_k00000-0000-0000-0000-0000000000"
  global.TEST_APP_APPID = "00000000-0000-0000-0000-0000000000"

  // General
  global.BASE_PUBLIC_KEY = "042e438c99bd7ded27ed921919e1d5ee1d9b1528bb8a2f6c974362ad1a9ba7a6f59a452a0e4dfbc178ab5c5c090506bd7f0a6659fd3cf0cc769d6c17216d414163"
  global.BASE_PRIVATE_KEY = "720d62b5dba86d798c4ec200df7d7937451b4d24a7c5227f0e8df1905f6af5c8"

  // Algorand
  global.ALGORAND_SERVICE_API_KEY = settings.ALGORAND_SERVICE_API_KEY

  console.log('TEST_ENV_VERSION --->', settings.ENV_VERSION)
}

setupGlobalConstants()
