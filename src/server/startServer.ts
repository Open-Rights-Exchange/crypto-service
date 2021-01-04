// Hosts Backend - Graphql Service
// Hosts Frontend - Static files built with npm run build
/* eslint-disable import/first */

require('newrelic')

import dotenv from 'dotenv'
import { connectToMongo } from '../backend/services/mongo/connectors'
import { initLogger } from '../helpers'
import { createExpressServer } from './createServer'
import { CONSTANTS } from '../backend/constants'

dotenv.config()

const isRunningProduction = process.env.NODE_ENV === 'production'

// trap and record unhandled promise rejections
process.on('unhandledRejection', (error, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'error:', error)
})

const { PORT, MONGO_URI, MONGO_TIMEOUT } = process.env

;(() => {
  try {
    startServer()
  } catch (error) {
    console.log('Problem starting server - ', error)
  }
})()

async function startServer() {
  await connectToMongo(MONGO_URI, MONGO_TIMEOUT)
  // await loadDatabaseSettings()
  initLogger()
  console.log('server - isRunningProduction:', isRunningProduction)
  const expressServer = await createExpressServer(CONSTANTS)
  expressServer.listen(PORT, () => {
    console.log(`crypto-service is now running on {server}:${PORT}`)
  })
}
