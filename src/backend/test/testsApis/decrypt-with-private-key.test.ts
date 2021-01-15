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
  createExpressServerForTest,
  createEncryptedAndAuthToken,
} from '../helpers'
import { setupGlobalConstants, CONSTANTS } from '../config/constants'

declare let global: any

const headers: any = {
  'api-key': global.TEST_APP_API_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
}
const stringToEncrypt = 'encrypt-this-string'
const chain = new ChainFactory().create(ChainType.AlgorandV1, [{ url: null }])

const decryptWPrivateKeyParams: any = {
  chainType: 'algorand',
  symmetricOptionsForEncryptedPrivateKeys: global.SYMMETRIC_ED25519_OPTIONS,
  returnAsymmetricOptions: {
    publicKeys: [global.ALGO_PUB_KEY],
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

  it('symmetricEncryptedPrivateKeys: should return 200 & return encrypted string encrypted with private key', async done => {
    // encrypt our private key symmetrically (using our password)
    decryptWPrivateKeyParams.symmetricEncryptedPrivateKeys = [
      chain.encryptWithPassword(global.ALGO_PRIVATE_KEY, global.MY_PASSWORD, global.SYMMETRIC_AES_OPTIONS),
    ]
    // encrypt a payload using our associated public key
    const encrypted = await chain.encryptWithPublicKey(stringToEncrypt, global.ALGO_PUB_KEY)
    decryptWPrivateKeyParams.encrypted = encrypted

    const passwordAuthToken = await createAuthToken(apiUrl, encrypted, global.BASE_PUBLIC_KEY, {
      password: global.MY_PASSWORD,
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
        const decryptedString = await chain.decryptWithPrivateKey(encryptedString, global.ALGO_PRIVATE_KEY)
        expect(decryptedString).toMatch(stringToEncrypt)
        done()
      })
  })
  it('asymmetricEncryptedPrivateKeys: should return 200 & decrypted string encrypted with symmetric options', async done => {
    const decryptWPrivateKeyParamsNew: any = {
      chainType: 'algorand',
      // symmetricOptionsForEncryptedPrivateKeys: global.SYMMETRIC_ED25519_OPTIONS,
      returnAsymmetricOptions: {
        publicKeys: [global.ALGO_PUB_KEY],
      },
    }
    // encrypt our private key symmetrically (using our password)
    const encryptedPrivateKey = [
      Crypto.Asymmetric.encryptWithPublicKey(global.BASE_PUBLIC_KEY, global.ALGO_PRIVATE_KEY),
    ]
    decryptWPrivateKeyParamsNew.asymmetricEncryptedPrivateKeysAndAuthToken = await createEncryptedAndAuthToken(
      apiUrl,
      encryptedPrivateKey,
      global.BASE_PUBLIC_KEY,
    )
    // encrypt a payload using our associated public key
    const encrypted = await chain.encryptWithPublicKey(stringToEncrypt, global.ALGO_PUB_KEY)
    decryptWPrivateKeyParamsNew.encrypted = encrypted
    headers['auth-token'] = await createAuthToken(apiUrl, decryptWPrivateKeyParamsNew, global.BASE_PUBLIC_KEY)

    supertest(server)
      .post('/decrypt-with-private-keys')
      .set(headers)
      .send(decryptWPrivateKeyParamsNew)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(async (err, res) => {
        if (err) return done(err)
        const encryptedString = chain.toAsymEncryptedDataString(
          JSON.stringify(JSON.parse(res.body.asymmetricEncryptedString)[0]),
        )
        const decryptedString = await chain.decryptWithPrivateKey(encryptedString, global.ALGO_PRIVATE_KEY)
        expect(decryptedString).toMatch(stringToEncrypt)
        done()
      })
  })

  it('should return 200 & decrypted string', async done => {
    const decryptWPrivateKeyParamsNew: any = {
      chainType: 'algorand',
      // symmetricOptionsForEncryptedPrivateKeys: global.SYMMETRIC_ED25519_OPTIONS,
      // returnAsymmetricOptions: {
      //   publicKeys: [global.ALGO_PUB_KEY],
      // },
    }
    // encrypt our private key symmetrically (using our password)
    const encryptedPrivateKey = [
      Crypto.Asymmetric.encryptWithPublicKey(global.BASE_PUBLIC_KEY, global.ALGO_PRIVATE_KEY),
    ]
    decryptWPrivateKeyParamsNew.asymmetricEncryptedPrivateKeysAndAuthToken = await createEncryptedAndAuthToken(
      apiUrl,
      encryptedPrivateKey,
      global.BASE_PUBLIC_KEY,
    )
    // encrypt a payload using our associated public key
    const encrypted = await chain.encryptWithPublicKey(stringToEncrypt, global.ALGO_PUB_KEY)
    decryptWPrivateKeyParamsNew.encrypted = encrypted
    headers['auth-token'] = await createAuthToken(apiUrl, decryptWPrivateKeyParamsNew, global.BASE_PUBLIC_KEY)

    supertest(server)
      .post('/decrypt-with-private-keys')
      .set(headers)
      .send(decryptWPrivateKeyParamsNew)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(async (err, res) => {
        if (err) return done(err)
        expect(res.body.decryptedResult).toMatch(stringToEncrypt)
        done()
      })
  })

  it('should throw an error: api_bad_parameter: password is required', async done => {
    // encrypt our private key symmetrically (using our password)
    decryptWPrivateKeyParams.symmetricEncryptedPrivateKeys = [
      chain.encryptWithPassword(global.ALGO_PRIVATE_KEY, global.MY_PASSWORD, global.SYMMETRIC_AES_OPTIONS),
    ]
    // encrypt a payload using our associated public key
    const encrypted = await chain.encryptWithPublicKey(stringToEncrypt, global.ALGO_PUB_KEY)
    decryptWPrivateKeyParams.encrypted = encrypted

    // not sending a password here
    const passwordAuthToken = await createAuthToken(apiUrl, encrypted, global.BASE_PUBLIC_KEY, {})
    decryptWPrivateKeyParams.symmetricOptionsForEncryptedPrivateKeys.passwordAuthToken = passwordAuthToken
    headers['auth-token'] = await createAuthToken(apiUrl, decryptWPrivateKeyParams, global.BASE_PUBLIC_KEY)

    supertest(server)
      .post('/decrypt-with-private-keys')
      .set(headers)
      .send(decryptWPrivateKeyParams)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(async (err, res) => {
        expect(res.body?.errorCode).toMatch('api_bad_parameter')
        done()
      })
  })

  it('should throw an error: api_bad_parameter: Both symmetricEncryptedPrivateKeys and asymmetricEncryptedPrivateKeys were not provided', async done => {
    // encrypt our private key symmetrically (using our password)
    /* decryptWPrivateKeyParams.symmetricEncryptedPrivateKeys = [
      chain.encryptWithPassword(algoPrivateKey, myPassword, symmetricAesOptions),
    ] */
    // encrypt a payload using our associated public key
    const newdecryptWPrivateKeyParams: any = {
      chainType: 'algorand',
      symmetricOptionsForEncryptedPrivateKeys: global.SYMMETRIC_ED25519_OPTIONS,
      returnAsymmetricOptions: {
        publicKeys: [global.ALGO_PUB_KEY],
      },
    }
    const encrypted = await chain.encryptWithPublicKey(stringToEncrypt, global.ALGO_PUB_KEY)
    newdecryptWPrivateKeyParams.encrypted = encrypted

    // not sending a password here
    const passwordAuthToken = await createAuthToken(apiUrl, encrypted, global.BASE_PUBLIC_KEY, {
      password: global.MY_PASSWORD,
    })
    newdecryptWPrivateKeyParams.symmetricOptionsForEncryptedPrivateKeys.passwordAuthToken = passwordAuthToken
    headers['auth-token'] = await createAuthToken(apiUrl, newdecryptWPrivateKeyParams, global.BASE_PUBLIC_KEY)

    supertest(server)
      .post('/decrypt-with-private-keys')
      .set(headers)
      .send(newdecryptWPrivateKeyParams)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(async (err, res) => {
        expect(res.body?.errorCode).toMatch('api_bad_parameter')
        done()
      })
  })
  // TODO: Add other API endpoint tests - add sample data to dbmocks as needed
})
