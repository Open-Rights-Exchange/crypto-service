# Guidelines for writing crypto-service tests

## Structure
  The backend tests are present under src/backend/test. It has following partitions:
  - `__ mocks __` : contains mocks for requests sent to any external libraries (e.g. segment etc.)
  - `config`: test setup config
    - `constants.ts`: contains all the global constants AND the .env / constants for the test server 
    - `.env.test`: contains secrets that should not be commited to Github 
  - `dbMocks`: contains the sample data for the mongo tables
  - `dataMocks`: reusable data structures used in tests
  - `testsApis`: integration tests for the api /routes - one file named after each endpoint (e.g. verify-public-key.test.ts)
  - `testsResolvers`: unit tests - one test file for each code file in backend/resolvers (e.g. token.test.ts)


## Setup
1. Populate test env values into `/backend/test/config/.env.test`
2. The API endpoint tests expect a Mongo service to be running on localhost:27017 - install it using [these](https://stackoverflow.com/questions/57856809/installing-mongodb-with-homebrew/57881349#57881349) instructions

## Unit tests
* Every resolver file under web/backend/resolver has a test file under web/backend/test/testsResolver

## API endpoint tests
* Every API endpoints has one test named after the endpoint in web/backend/test/testsApis 
* One each run, an entire Express server is instantiated using config defined in config/constants.ts
* A local MongoDB database is created and populated with sample data via: /test/helpers/mongo.ts initializeDB()
* The API endpoint tests expect a Mongo service to be running on localhost:27017  (see Setup above)

<br>

Run these tests from the `/src` directory

All tests

```
npm run test
```

A specific test file

```
npm run test -n {{TEST_NAME}}.test.ts
```

#### Notes
* To skip any test, mark them as `xit` instead of `it`

* To skip the entire test file, rename it to start with `_`
