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
const ethPubKey =
  '0xc68e0f87e57569a1a053bba68ecde6a55c19d93a3e1ab845be60b2828991b3de30d74a9fdd9602d30434376ef1e922ffdbc61b4ea31a8c8c7427b935337e82d6'
const ethPrivateKey = '5f8b66eea19b59c7a477142fb7204d762e2d446e98334101e851fd0e1ccff318'
const apiUrl = `${global.TEST_SERVER_PATH}/encrypt`
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

describe('Test api /encrypt endpoint', () => {
  jest.setTimeout(10000)

  it('should return 200 & return encrypted string', async done => {
    const encryptParams = {
      chainType: 'ethereum',
      toEncrypt: 'encrypt-this-string',
      asymmetricOptions: {
        publicKeys: [ethPubKey],
      },
    }
    const authToken = await createAuthToken(apiUrl, encryptParams, global.BASE_PUBLIC_KEY, null)
    headers['auth-token'] = authToken

    // results are encrypted with our public key, so we can decrypt it with the matching private key
    const chain = new ChainFactory().create(ChainType.EthereumV1, [{ url: null }])

    supertest(server)
      .post('/encrypt')
      .set(headers)
      .send({ ...encryptParams })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(async (err, res) => {
        if (err) return done(err)
        const encryptedString = JSON.parse(res.body.asymmetricEncryptedString)[0]
        const decryptedString = await chain.decryptWithPrivateKey(encryptedString, ethPrivateKey)
        expect(decryptedString).toMatch('encrypt-this-string')
        done()
      })
  })
  // TODO: Add other API endpoint tests - add sample data to dbmocks as needed
})
