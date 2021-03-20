import helmet from 'helmet'
import express from 'express'
import bodyParser from 'body-parser'
import { addCorsMiddlware, errorHandler } from './serverAuth'
import { addRoutesToExpressServer } from '../backend/api/routes'
import { Config } from '../models'
import { StateStore } from '../helpers/stateStore'

export async function createExpressServer(config: Config, state: StateStore) {
  const server = express()

  // enable CORS - Cross Origin Resource Sharing
  server.use(addCorsMiddlware())
  // parse body params and attache them to req.body
  server.use(bodyParser.json())
  server.use(bodyParser.urlencoded({ extended: true }))
  // secure apps by setting various HTTP headers
  server.use(helmet())

  // /healthcheck, and other api endpoints
  addRoutesToExpressServer(server, config, state)
  // this should be after middleware that can throw errors
  server.use(errorHandler)

  return server
}
