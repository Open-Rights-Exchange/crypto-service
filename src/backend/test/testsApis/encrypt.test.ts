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

  it('should return 200 & return asymmetric encrypted string', async done => {
    const encryptParams = {
      chainType: 'ethereum',
      toEncrypt: 'encrypt-this-string',
      asymmetricOptions: {
        publicKeys: [global.ETH_PUB_KEY],
      },
    }
    const authToken = await createAuthToken(apiUrl, encryptParams, global.BASE_PUBLIC_KEY, null)
    headers['auth-token'] = authToken

    // results are encrypted with our public key, so we can decrypt it with the matching private key
    const chain = new ChainFactory().create(ChainType.EthereumV1, [{ url: null }])

    supertest(server)
      .post('/encrypt')
      .set(headers)
      .send(encryptParams)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(async (err, res) => {
        if (err) return done(err)
        const encryptedString = JSON.parse(res.body.asymmetricEncryptedString)[0]
        const decryptedString = await chain.decryptWithPrivateKey(encryptedString, global.ETH_PPRIVATE_KEY)
        expect(decryptedString).toMatch('encrypt-this-string')
        done()
      })
  })

  it('should return 200 & return symmetric encrypted string', async done => {
    const encryptParams = {
      chainType: 'ethereum',
      toEncrypt: 'encrypt-this-string',
      symmetricOptions: global.SYMMETRIC_AES_OPTIONS,
    }
    encryptParams.symmetricOptions.passwordAuthToken = await createAuthToken(
      apiUrl,
      encryptParams.toEncrypt,
      global.BASE_PUBLIC_KEY,
      { password: global.MY_PASSWORD },
    )
    const authToken = await createAuthToken(apiUrl, encryptParams, global.BASE_PUBLIC_KEY, null)
    headers['auth-token'] = authToken

    // results are encrypted with our public key, so we can decrypt it with the matching private key
    const chain = new ChainFactory().create(ChainType.EthereumV1, [{ url: null }])

    supertest(server)
      .post('/encrypt')
      .set(headers)
      .send(encryptParams)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(async (err, res) => {
        if (err) return done(err)
        const encryptedString = JSON.parse(res.body.symmetricEncryptedString)
        const decryptedString = chain.decryptWithPassword(
          encryptedString,
          global.MY_PASSWORD,
          global.SYMMETRIC_AES_OPTIONS,
        )
        expect(decryptedString).toMatch('encrypt-this-string')
        done()
      })
  })

  it('should throw an error: api_bad_parameter: toEncrypt', async done => {
    const encryptParams = {
      chainType: 'ethereum',
      asymmetricOptions: {
        publicKeys: [global.ETH_PUB_KEY],
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
        expect(res.body?.errorCode).toMatch('api_bad_parameter')
        expect(res.body?.errorMessage).toContain('Missing required parameter(s) in request body: toEncrypt')
        done()
      })
  })

  it('should throw an error: api_bad_parameter: asymmetricOptions, symmetricOptions', async done => {
    const encryptParams = {
      chainType: 'ethereum',
      toEncrypt: 'encrypt-this-string',
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
        expect(res.body?.errorCode).toMatch('api_bad_parameter')
        expect(res.body?.errorMessage).toContain(
          'Missing at least one of these parameters in request body: asymmetricOptions, symmetricOptions',
        )
        done()
      })
  })

  it('should throw an error: api_bad_parameter: missing password', async done => {
    const encryptParams = {
      chainType: 'ethereum',
      toEncrypt: 'encrypt-this-string',
      symmetricOptions: global.SYMMETRIC_AES_OPTIONS,
    }
    encryptParams.symmetricOptions.passwordAuthToken = await createAuthToken(
      apiUrl,
      encryptParams.toEncrypt,
      global.BASE_PUBLIC_KEY,
      null,
    )
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
        expect(res.body?.errorCode).toMatch('api_bad_parameter')
        expect(res.body?.errorMessage).toContain('Password is required to encrypt.')
        done()
      })
  })
})
