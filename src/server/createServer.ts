import dotenv from 'dotenv'
import helmet from 'helmet'
import express from 'express'
import bodyParser from 'body-parser'
import { addCorsMiddlware, errorHandler } from './serverAuth'
import { router as apiRouter } from '../backend/api/_routes'

dotenv.config()

export async function createExpressServer() {
  const server = express()

  // enable CORS - Cross Origin Resource Sharing
  server.use(addCorsMiddlware())
  // parse body params and attache them to req.body
  server.use(bodyParser.json())
  server.use(bodyParser.urlencoded({ extended: true }))
  // secure apps by setting various HTTP headers
  server.use(helmet())

  // /healthcheck, and other api endpoints
  server.use(apiRouter)
  // this should be after middleware that can throw errors
  server.use(errorHandler)

  return server
}
