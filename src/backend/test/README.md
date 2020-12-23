# Guidelines for writing crypto-service tests

## Structure
  The backend tests are present under src/backend/test. It has following partitions:
  - __ mocks __ : contains mocks for requests sent to any external libraries (e.g. segment etc.)
  - dbMocks: contains the sample data for the mongo tables
  - dataMocks: reusable data structures used in tests
  - api: mocks for the /api/routes
  - resolvers: one test file for each code file in backend/resolvers

## Setup
1. Copy test env values from lastpass named `env.test cryptoservice` and paste in `/backend/test/config/.env.test`

## Unit tests
* Every resolver file under web/backend/resolver has a test file under web/backend/test/resolver

* Structure of a test file can be like this:
  - Higher level describe block named same as the file name
  - Each function in the source file can then have its own describe block
  - Multiple tests inside each function-level describe block. The test description should be a sentence and easily understandable. For ex- it('generates key pair')

  ```
  describe('crypto'... // filename
    describe('encryptWithPassword'... //function name
       it('encrypts the credential with password') // understandable description
  ```

Run these commands from the `/src` directory

All tests in the folder

```
./node_modules/.bin/jest ./backend/test
```

A specific file

```
./node_modules/.bin/jest ./backend/test/{{TEST_NAME}}.test.ts
```

#### Notes
* To skip any test, mark them as `xit` instead of `it`

* To skip the entire test file, rename it to start with `_`
