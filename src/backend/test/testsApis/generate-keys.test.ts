/* eslint-disable consistent-return */
/* eslint-disable jest/no-done-callback */
import supertest from 'supertest'
import { Server } from 'http'
import { ChainFactory, ChainType } from '@open-rights-exchange/chainjs'
import { openDB, closeDB, clearDB, initializeDB, createAuthToken, createExpressServerForTest } from '../helpers'
import { setupGlobalConstants } from '../config/constants'

declare let global: any

const headers: any = {
  'api-key': global.TEST_APP_API_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
}
const apiUrl = `${global.TEST_SERVER_PATH}/generate-keys`
/**
 * Test API Endpoints
 */

// Using supertest - https://github.com/visionmedia/supertest
// Example: - https://losikov.medium.com/part-4-node-js-express-typescript-unit-tests-with-jest-5204414bf6f0

let server: Server

beforeAll(async () => {
  await openDB('test_cryptoapi')
  await initializeDB()
  server = await createExpressServerForTest()
  setupGlobalConstants()
})

afterAll(async () => {
  server.close()
  await clearDB()
  await closeDB()
})

describe('Test api /generate-keys endpoint', () => {
  jest.setTimeout(10000)

  it('should return 200 & return generated keys', async done => {
    const myPassword = 'my-secure-password'
    const symmetricAesOptions = {
      salt: 'my-salt',
      iter: 50000,
    }
    const generateKeyParams: any = {
      chainType: 'ethereum',
      symmetricOptions: symmetricAesOptions,
    }

    const passwordAuthToken = await createAuthToken(apiUrl, null, global.BASE_PUBLIC_KEY, { password: myPassword })
    generateKeyParams.symmetricOptions.passwordAuthToken = passwordAuthToken
    const authToken = await createAuthToken(apiUrl, generateKeyParams, global.BASE_PUBLIC_KEY)
    headers['auth-token'] = authToken
    const chain = new ChainFactory().create(ChainType.EthereumV1, [{ url: null }])
    supertest(server)
      .post('/generate-keys')
      .set(headers)
      .send({ ...generateKeyParams })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)
        const encryptedPrivateKey = res.body[0].symmetricEncryptedString
        const newPrivateKey = chain.decryptWithPassword(encryptedPrivateKey, myPassword, symmetricAesOptions)
        expect(chain.isValidPublicKey(res.body[0].publicKey).toString()).toMatch('true')
        expect(chain.isValidPrivateKey(newPrivateKey).toString()).toMatch('true')
        done()
      })
  })
  // TODO: Add other API endpoint tests - add sample data to dbmocks as needed
})
