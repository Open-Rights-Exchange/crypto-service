import { openDB, closeDB, clearDB, initializeDB } from '../helpers'
import {
  createContext,
  decodedAuthToken1,
  requestBodyEmpty,
  requestUrl,
  encodedBody1,
  encodedToken1wNullUrl,
  decodedAuthToken1wNullUrl,
} from '../dataMocks'
import { validateAuthTokenAndExtractContents } from '../../resolvers/token'
import { AuthTokenType } from '../../../models'

declare let global: any

// Using these patterns: https://jestjs.io/docs/en/manual-mocks

/**
 * AuthToken Tests
 */

describe('Test token handling and validation', () => {
  jest.setTimeout(10000)

  beforeAll(async () => {
    await openDB('test_token')
    await initializeDB()
  })

  afterAll(async () => {
    await clearDB()
    await closeDB()
  })

  describe('Validate token', () => {
    const context = createContext()

    it('decodes and validates correctly', async () => {
      const token = await validateAuthTokenAndExtractContents({
        authTokenType: AuthTokenType.ApiHeader,
        requestUrl,
        encryptedAuthToken: VALID_AUTH_TOKEN,
        requestBody: requestBodyEmpty,
        context,
      })
      expect(token).toStrictEqual(decodedAuthToken1)
    })

    it('Should throw if token already used', async () => {
      await expect(
        validateAuthTokenAndExtractContents({
          authTokenType: AuthTokenType.ApiHeader,
          requestUrl,
          encryptedAuthToken: VALID_AUTH_TOKEN,
          requestBody: requestBodyEmpty,
          context,
        }),
      ).rejects.toThrow('Auth token has already been used.')
    })

    it('Should throw if bad AuthToken', async () => {
      await expect(
        validateAuthTokenAndExtractContents({
          authTokenType: AuthTokenType.ApiHeader,
          requestUrl,
          encryptedAuthToken: 'abcdefg', // bad value
          requestBody: requestBodyEmpty,
          context,
        }),
      ).rejects.toThrow(new Error('Invalid value provided as asymmetrically encrypted item.'))
    })

    it('Should throw if not encrypted with server’s base key', async () => {
      await expect(
        validateAuthTokenAndExtractContents({
          authTokenType: AuthTokenType.ApiHeader,
          requestUrl,
          encryptedAuthToken: INVALID_ENCRYPTED_AUTH_TOKEN,
          requestBody: requestBodyEmpty,
          context,
        }),
      ).rejects.toThrow(
        'Could not retrieve PrivateKey for PublicKey: 042e438c99bd7ded27ed921919e1d5ee1d9b1528bb8a2f6c974362ad1a9ba7a6f59a452a0e4dfbc178ab5c5c090506bd7f0a6659fd3cf0cc769d6c17216d414163. Service does not have access to it.',
      )
    })

    it('decodes and validates correctly with null url', async () => {
      const token = await validateAuthTokenAndExtractContents({
        authTokenType: AuthTokenType.ApiHeader,
        requestUrl,
        encryptedAuthToken: encodedToken1wNullUrl,
        requestBody: encodedBody1,
        context,
      })
      expect(token).toStrictEqual(decodedAuthToken1wNullUrl)
    })

    // it('token is already used', async () => {
    //   await expect(
    //     validateAuthTokenAndExtractContents({
    //       authTokenType: AuthTokenType.ApiHeader,
    //       requestUrl,
    //       encryptedAuthToken: encodedToken1,
    //       requestBody: requestBodyEmpty,
    //       context,
    //     }),
    //   ).rejects.toThrow(new Error('Auth token has already been used.'))
    // })
  })

    it('Should throw if req url doesn’t match', async () => {
      await expect(
        validateAuthTokenAndExtractContents({
          authTokenType: AuthTokenType.ApiHeader,
          requestUrl: `${requestUrl}_invalid`,
          encryptedAuthToken: VALID_AUTH_TOKEN,
          requestBody: requestBodyEmpty,
          context,
        }),
      ).rejects.toThrow(`Auth Token url doesn't match actual request url http://localhost:8080/sign_invalid.`)
    })

    it('Should throw if expired', async () => {
      await expect(
        validateAuthTokenAndExtractContents({
          authTokenType: AuthTokenType.ApiHeader,
          requestUrl,
          encryptedAuthToken: EXPIRED_AUTH_TOKEN,
          requestBody: requestBodyEmpty,
          context,
        }),
      ).rejects.toThrow(
        `Auth Token has expired on 2021-01-03T05:33:39.208Z or is not valid at the current time: 2021-01-04T05:31:39.208Z.`,
      )
    })
  })
})
