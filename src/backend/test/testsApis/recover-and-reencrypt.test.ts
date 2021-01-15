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
    const recoverAndReencryptParams: any = {
      chainType: 'algorand',
      asymmetricOptionsForReencrypt: {
        publicKeys: [global.ALGO_PUB_KEY],
      },
    }

    // encrypt a payload using our public key - in this example, its a private key we've 'backed-up'
    const privateKeyToRecover = await chain.encryptWithPublicKey(prviateKeyToEncrypt, global.ALGO_PUB_KEY)
    // wrap the encrypted payload with an authToken that governs how the service can use the payload
    recoverAndReencryptParams.encryptedAndAuthToken = await createEncryptedAndAuthToken(
      apiUrl,
      privateKeyToRecover,
      global.BASE_PUBLIC_KEY,
    )
    // encrypt the private keys we'll use to decrypt the privateKeyToRecover
    const encryptedPrivateKey = Crypto.Asymmetric.encryptWithPublicKey(global.BASE_PUBLIC_KEY, global.ALGO_PRIVATE_KEY)
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
        const decryptedString = await chain.decryptWithPrivateKey(encryptedString, global.ALGO_PRIVATE_KEY)
        expect(decryptedString).toMatch(prviateKeyToEncrypt)
        done()
      })
  })

  it('should return 200 & return encrypted private key symmetric only', async done => {
    const chain = new ChainFactory().create(ChainType.AlgorandV1, [{ url: null }])
    const prviateKeyToEncrypt = 'private-key-to-recover'
    const recoverAndReencryptParams: any = {
      chainType: 'algorand',
      symmetricOptionsForReencrypt: global.SYMMETRIC_ED25519_OPTIONS,
    }

    // encrypt a payload using our public key - in this example, its a private key we've 'backed-up'
    const privateKeyToRecover = await chain.encryptWithPublicKey(prviateKeyToEncrypt, global.ALGO_PUB_KEY)

    // wrap the encrypted payload with an authToken that governs how the service can use the payload
    recoverAndReencryptParams.encryptedAndAuthToken = await createEncryptedAndAuthToken(
      apiUrl,
      privateKeyToRecover,
      global.BASE_PUBLIC_KEY,
    )
    // encrypt the private keys we'll use to decrypt the privateKeyToRecover
    const encryptedPrivateKey = Crypto.Asymmetric.encryptWithPublicKey(global.BASE_PUBLIC_KEY, global.ALGO_PRIVATE_KEY)

    recoverAndReencryptParams.symmetricOptionsForReencrypt.passwordAuthToken = await createAuthToken(
      apiUrl,
      privateKeyToRecover,
      global.BASE_PUBLIC_KEY,
      { password: global.MY_PASSWORD },
    )
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
        const decryptedString = chain.decryptWithPassword(
          res.body.symmetricEncryptedString,
          global.MY_PASSWORD,
          global.SYMMETRIC_ED25519_OPTIONS,
        )
        expect(decryptedString).toMatch(prviateKeyToEncrypt)
        done()
      })
  })

  it('should throw password missing error', async done => {
    const chain = new ChainFactory().create(ChainType.AlgorandV1, [{ url: null }])
    const prviateKeyToEncrypt = 'private-key-to-recover'
    const recoverAndReencryptParams: any = {
      chainType: 'algorand',
      symmetricOptionsForReencrypt: global.SYMMETRIC_ED25519_OPTIONS,
    }

    // encrypt a payload using our public key - in this example, its a private key we've 'backed-up'
    const privateKeyToRecover = await chain.encryptWithPublicKey(prviateKeyToEncrypt, global.ALGO_PUB_KEY)

    // wrap the encrypted payload with an authToken that governs how the service can use the payload
    recoverAndReencryptParams.encryptedAndAuthToken = await createEncryptedAndAuthToken(
      apiUrl,
      privateKeyToRecover,
      global.BASE_PUBLIC_KEY,
    )
    // encrypt the private keys we'll use to decrypt the privateKeyToRecover
    const encryptedPrivateKey = Crypto.Asymmetric.encryptWithPublicKey(global.BASE_PUBLIC_KEY, global.ALGO_PRIVATE_KEY)

    recoverAndReencryptParams.symmetricOptionsForReencrypt.passwordAuthToken = await createAuthToken(
      apiUrl,
      privateKeyToRecover,
      global.BASE_PUBLIC_KEY,
      {},
    )
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
      .expect(400)
      .end(async (err, res) => {
        if (err) return done(err)
        expect(res.body.errorCode).toMatch('api_bad_parameter')
        done()
      })
  })
})
