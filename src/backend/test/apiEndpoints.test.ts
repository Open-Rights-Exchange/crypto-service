import { openDB, closeDB, clearDB, initializeDB } from './helpers'
import { getPublicKey } from './api'
import { Mongo } from '../services/mongo/models'
import { findMongo } from '../services/mongo/resolvers'
import { ContextTest } from './config/globalMocks'

declare let global: any

/**
 * Tests
 */

// TODO: Rework API endpoints tests to use supertest example: - https://losikov.medium.com/part-4-node-js-express-typescript-unit-tests-with-jest-5204414bf6f0

describe('Test api endpoints', () => {
  jest.setTimeout(10000)

  beforeAll(async () => {
    await openDB('test_cryptoapi')
    await initializeDB()
  })

  afterAll(async () => {
    await clearDB()
    await closeDB()
  })

  // XX_describe('Returns the Base Public Key', () => {
  //   XX_it.skip('returns the correct Base Public Key', async () => {
  //     const { publicKey }: any = await getPublicKey({ apiKey: global.TEST_APP_API_KEY })
  //     expect(publicKey).toEqual(global.BASE_PUBLIC_KEY)
  //   })
  // })

  // TODO: Add other API endpoint tests - add sample data to dbmocks as needed
})
