import { Request as ExpressRequest } from 'express'
import { openDB, closeDB, clearDB, initializeDB } from '../helpers'
import { getPublicKey } from '../api'
import { createContext, requestBodyEmpty, encodedToken1, requestUrl } from '../dataMocks'
import { Mongo } from '../../services/mongo/models'
import { findMongo } from '../../services/mongo/resolvers'
import { validateAuthTokenAndExtractContents } from '../../resolvers/token'
import { AuthTokenType } from '../../models'

declare let global: any

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
    it('payloadHash does not match', async () => {
      await expect(
        validateAuthTokenAndExtractContents({
          authTokenType: AuthTokenType.ApiHeader,
          requestUrl,
          encryptedAuthToken: encodedToken1,
          requestBody: requestBodyEmpty,
          context,
        }),
      ).rejects.toThrow(new Error('Auth Token payloadHash does not match Sha256Hash of request body.'))
    })
  })

  // TODO: Add other token tests
})
