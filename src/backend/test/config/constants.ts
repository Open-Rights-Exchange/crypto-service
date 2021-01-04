declare let global: any

// /////////////////////// /// //
// SET UP FOR ALL THE TESTS    //
// /////////////////////// /// //

// if a variable is declared as global, it can be used across the entire test suite
// The following account keys are not used in production...

// NOTE: All keys in this file should be unique, and should not exist anywhere else
// NOTE: So, when adding new keys, make sure to generate them, and not copy/paste

export const setupGlobalConstants = () => {
  global.TEST_API_ENDPOINT = 'http://localhost:8080'
  global.EOS_KYLIN_CHAIN_ID = '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191'
  global.EOS_KYLIN_URL = 'https://api.kylin.alohaeos.com:443'

  // Automated Tests
  global.processId = 'abc14c84571d'
  global.TEST_APP_API_KEY = "t_k00000-0000-0000-0000-0000000000"
  global.TEST_APP_APPID = "00000000-0000-0000-0000-0000000000"

  // General
  global.BASE_PUBLIC_KEY = "04cea2c951504b5bfefa78480ae632da2c7889561325f9d76ca7b0a1e62f7a8cd52ce313c8b3fd3c7ffe2f588322e5be331c64b31b256a8769e92f947ae712b761"
  global.BASE_PRIVATE_KEY = "720d62b5dba86d798c4ec200df7d7937451b4d24a7c5227f0e8df1905f6af5c8"
}

setupGlobalConstants()