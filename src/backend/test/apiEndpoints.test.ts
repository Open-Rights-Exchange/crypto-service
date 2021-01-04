import path from 'path'
import supertest from 'supertest'
import { Express } from 'express-serve-static-core'
import { openDB, closeDB, clearDB, initializeDB } from './helpers'
import { createExpressServer } from '../../server/createServer'
import { getPublicKey } from './api'
import { Mongo } from '../services/mongo/models'
import { findMongo } from '../services/mongo/resolvers'
import { ContextTest } from './config/globalMocks'

declare let global: any

const headers = { 'api-key': global.TEST_APP_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' }

/**
 * Test API Endpoints
 */

// Using supertest - https://github.com/visionmedia/supertest
// Example: - https://losikov.medium.com/part-4-node-js-express-typescript-unit-tests-with-jest-5204414bf6f0

let server: Express

beforeAll(async () => {
  await openDB('test_cryptoapi')
  await initializeDB()
  console.log('global.BASE_PRIVATE_KEY:', global.BASE_PRIVATE_KEY)
  server = await createExpressServer()
})

afterAll(async () => {
  await clearDB()
  await closeDB()
})

describe('Test api endpoints', () => {
  jest.setTimeout(10000)

  it('should return 200 & valid response if request param list is empty', async done => {
    supertest(server)
      .post('/verify-public-key')
      .send({ nonce: 'random-nonce' })
      .set(headers)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)
        expect(res.body).toMatchObject({
          publicKey: global.BASE_PUBLIC_KEY,
          signature:
            '84fb921b914cab0b12d87960459fa2bb907323434138f79f1694c58510e711847478badf21e8230c1a48b7b26e2b42cd2cf054cb2df4828ee125b94515d6be87',
        })
        done()
      })
  })

  // TODO: Add other API endpoint tests - add sample data to dbmocks as needed
})
