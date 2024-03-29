// Hosts Backend - Graphql Service
// Hosts Frontend - Static files built with npm run build
/* eslint-disable import/first */

require('newrelic')

import dotenv from 'dotenv'
import { connectToMongo } from '../backend/services/mongo/connectors'
import { createExpressServer } from './createServer'
import { CONSTANTS } from '../backend/constants'
import { StateStore } from '../helpers/stateStore'

dotenv.config()

const settingTracingEnabled = false
const isRunningProduction = process.env.NODE_ENV === 'production'
const config = { constants: CONSTANTS, settings: { tracingEnabled: settingTracingEnabled } }
// state stored across requests
const state = new StateStore()

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
  console.log('server - isRunningProduction:', isRunningProduction)
  const expressServer = await createExpressServer(config, state)
  expressServer.listen(PORT, () => {
    console.log(`crypto-service is now running on {server}:${PORT}`)
  })
}
