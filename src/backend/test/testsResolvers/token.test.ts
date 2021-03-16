import { Request as ExpressRequest } from 'express'
import { openDB, closeDB, clearDB, initializeDB, createAuthToken } from '../helpers'
import {
  createContext,
  decodedAuthToken1,
  requestBodyEmpty,
  encodedToken1,
  requestUrl,
  encodedBody1,
  encodedToken1wNullUrl,
  decodedAuthToken1wNullUrl,
} from '../dataMocks'
import { Mongo } from '../../services/mongo/models'
import { findMongo } from '../../services/mongo/resolvers'
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
    it('encryptedAuthToken is invalid', async () => {
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

    it('decodes and validates correctly', async () => {
      const token = await validateAuthTokenAndExtractContents({
        authTokenType: AuthTokenType.ApiHeader,
        requestUrl,
        encryptedAuthToken: encodedToken1,
        requestBody: encodedBody1,
        context,
      })
      expect(token).toStrictEqual(decodedAuthToken1)
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

  // TODO: Add other token tests
})
