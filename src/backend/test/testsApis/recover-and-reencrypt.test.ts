/* eslint-disable consistent-return */
/* eslint-disable jest/no-done-callback */
import supertest from 'supertest'
import { Server } from 'http'
import { ChainFactory, ChainType, Crypto } from '@open-rights-exchange/chainjs'
import {
  openDB,
  closeDB,
  clearDB,
  initializeDB,
  createAuthToken,
  createEncryptedAndAuthToken,
  createExpressServerForTest,
} from '../helpers'
import { setupGlobalConstants } from '../config/constants'

declare let global: any

const headers: any = {
  'api-key': global.TEST_APP_API_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
}
const algoPubKey = '1e36f5b07eab1c326de0218ea5bf9c68ce5a9d4bcfbe40ffe0b96ee81fb98fab'
const algoPrivateKey =
  '68c7d4579c891145a23deb3c8393810a5501dd1e41c09be56e23f2bec4e4e9681e36f5b07eab1c326de0218ea5bf9c68ce5a9d4bcfbe40ffe0b96ee81fb98fab'
const apiUrl = `${global.TEST_SERVER_PATH}/recover-and-reencrypt`
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

describe('Test api /recover-and-reencrypt endpoint', () => {
  jest.setTimeout(10000)

  it('should return 200 & return encrypted private key', async done => {
    const chain = new ChainFactory().create(ChainType.AlgorandV1, [{ url: null }])
    const prviateKeyToEncrypt = 'private-key-to-recover'
    const symmetricEd25519Options: any = {
      salt: 'my-salt',
    }
    const recoverAndReencryptParams: any = {
      chainType: 'algorand',
      symmetricOptionsForEncryptedPrivateKeys: symmetricEd25519Options,
      asymmetricOptionsForReencrypt: {
        publicKeys: [algoPubKey],
      },
    }

    // encrypt a payload using our public key - in this example, its a private key we've 'backed-up'
    const privateKeyToRecover = await chain.encryptWithPublicKey(prviateKeyToEncrypt, algoPubKey)
    // wrap the encrypted payload with an authToken that governs how the service can use the payload
    recoverAndReencryptParams.encryptedAndAuthToken = await createEncryptedAndAuthToken(
      apiUrl,
      privateKeyToRecover,
      global.BASE_PUBLIC_KEY,
    )
    // encrypt the private keys we'll use to decrypt the privateKeyToRecover
    const encryptedPrivateKey = Crypto.Asymmetric.encryptWithPublicKey(global.BASE_PUBLIC_KEY, algoPrivateKey)
    // wrap the encrypted keys with an authToken
    recoverAndReencryptParams.asymmetricEncryptedPrivateKeysAndAuthToken = await createEncryptedAndAuthToken(
      apiUrl,
      encryptedPrivateKey,
      global.BASE_PUBLIC_KEY,
    )

    // create api auth token
    const authToken = await createAuthToken(apiUrl, recoverAndReencryptParams, global.BASE_PUBLIC_KEY)
    headers['auth-token'] = authToken

    supertest(server)
      .post('/recover-and-reencrypt')
      .set(headers)
      .send({ ...recoverAndReencryptParams })
      .expect('Content-Type', /json/)
      .expect(200)
      .end(async (err, res) => {
        if (err) return done(err)
        const encryptedString = chain.toAsymEncryptedDataString(
          JSON.stringify(JSON.parse(res.body.asymmetricEncryptedString)[0]),
        )
        const decryptedString = await chain.decryptWithPrivateKey(encryptedString, algoPrivateKey)
        expect(decryptedString).toMatch(prviateKeyToEncrypt)
        done()
      })
  })
  // TODO: Add other API endpoint tests - add sample data to dbmocks as needed
})
