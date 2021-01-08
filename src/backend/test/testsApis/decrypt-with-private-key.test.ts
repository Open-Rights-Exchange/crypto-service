/* eslint-disable consistent-return */
/* eslint-disable jest/no-done-callback */
import supertest from 'supertest'
import { Server } from 'http'
import { ChainFactory, ChainType } from '@open-rights-exchange/chainjs'
import { openDB, closeDB, clearDB, initializeDB, createAuthToken, createExpressServerForTest } from '../helpers'
import { setupGlobalConstants, CONSTANTS } from '../config/constants'

declare let global: any

const headers: any = {
  'api-key': global.TEST_APP_API_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
}
const algoPubKey = '1e36f5b07eab1c326de0218ea5bf9c68ce5a9d4bcfbe40ffe0b96ee81fb98fab'
const algoPrivateKey =
  '68c7d4579c891145a23deb3c8393810a5501dd1e41c09be56e23f2bec4e4e9681e36f5b07eab1c326de0218ea5bf9c68ce5a9d4bcfbe40ffe0b96ee81fb98fab'
const symmetricAesOptions: any = {
  salt: 'my-salt',
  iter: 50000,
}
const symmetricEd25519Options: any = {
  salt: 'my-salt',
}
const stringToEncrypt = 'encrypt-this-string'
const chain = new ChainFactory().create(ChainType.AlgorandV1, [{ url: null }])
const myPassword = 'my-secure-password'

const decryptWPrivateKeyParams: any = {
  chainType: 'algorand',
  symmetricOptionsForEncryptedPrivateKeys: symmetricEd25519Options,
  returnAsymmetricOptions: {
    publicKeys: [algoPubKey],
  },
}
const apiUrl = `${global.TEST_SERVER_PATH}/decrypt-with-private-keys`
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

describe('Test api /decrypt-with-private-key endpoint', () => {
  jest.setTimeout(10000)

  it('should return 200 & return encrypted string encrypted with private key', async done => {
    decryptWPrivateKeyParams.symmetricEncryptedPrivateKeys = [
      chain.encryptWithPassword(algoPrivateKey, myPassword, symmetricAesOptions),
    ]
    const encrypted = await chain.encryptWithPublicKey(stringToEncrypt, algoPubKey)
    decryptWPrivateKeyParams.encrypted = encrypted

    const passwordAuthToken = await createAuthToken(apiUrl, encrypted, global.BASE_PUBLIC_KEY, {
      password: myPassword,
    })
    decryptWPrivateKeyParams.symmetricOptionsForEncryptedPrivateKeys.passwordAuthToken = passwordAuthToken
    headers['auth-token'] = await createAuthToken(apiUrl, decryptWPrivateKeyParams, global.BASE_PUBLIC_KEY)

    supertest(server)
      .post('/decrypt-with-private-keys')
      .set(headers)
      .send(decryptWPrivateKeyParams)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(async (err, res) => {
        if (err) return done(err)
        const encryptedString = chain.toAsymEncryptedDataString(
          JSON.stringify(JSON.parse(res.body.asymmetricEncryptedString)[0]),
        )
        const decryptedString = await chain.decryptWithPrivateKey(encryptedString, algoPrivateKey)
        expect(decryptedString).toMatch(stringToEncrypt)
        done()
      })
  })
  // TODO: Add other API endpoint tests - add sample data to dbmocks as needed
})
