// Hosts Backend - Graphql Service
// Hosts Frontend - Static files built with npm run build
/* eslint-disable import/first */

require('newrelic')

import dotenv from 'dotenv'

dotenv.config()

const isRunningProduction = process.env.NODE_ENV === 'production'

// trap and record unhandled promise rejections
process.on('unhandledRejection', (error, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'error:', error)
})

import helmet from 'helmet'
import express, { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import { connect } from '../backend/services/mongo/connectors'
import { addCorsMiddlware, errorHandler, logger } from './server_auth'
import { router as apiRouter } from '../backend/api/_routes'
import { initLogger } from '../backend/utils/helpers'

/* eslint-enable */

const { PORT } = process.env

// eslint-disable-next-line func-names
;(function () {
  try {
    startServer()
  } catch (error) {
    console.log('Problem starting server - ', error)
  }
})()

async function startServer() {
  await connect(process.env.MONGO_URI)
  // await loadDatabaseSettings()
  initLogger()
  console.log('server - isRunningProduction:', isRunningProduction)
  const expressServer = await createExpressServer()
  expressServer.listen(PORT, () => {
    console.log(`crypto-service is now running on {server}:${PORT}`)
  })
}

async function createExpressServer() {
  const server = express()

  // enable CORS - Cross Origin Resource Sharing
  server.use(addCorsMiddlware())
  // parse body params and attache them to req.body
  server.use(bodyParser.json())
  server.use(bodyParser.urlencoded({ extended: true }))
  // secure apps by setting various HTTP headers
  server.use(helmet())

  // /api, /healthcheck, and other endpoints
  server.use(apiRouter)

  // this should be after middleware that can throw errors
  server.use(errorHandler)

  return server
}
