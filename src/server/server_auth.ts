import { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { stringifySafe } from '../helpers'

// Auth
const jwt = require('express-jwt')
const jwtAuthz = require('express-jwt-authz')
const jwksRsa = require('jwks-rsa')
const { Base64 } = require('js-base64')
require('dotenv').config()

// CORS configuration - returns options for cors() middleware
function getCorsOptions(req: Request, callback: (error: Error, options: any) => void) {
  const corsOptions = {
    origin: '', // this server's url
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
  callback(null, corsOptions)
}

export function addCorsMiddlware() {
  return cors(getCorsOptions)
}

// global express error handler
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.log(`error handler err.name:${err.name}`)
  if (err.name === 'UnauthorizedError') {
    res
      .status(401)
      .json({ errorMessage: 'This is a secured endpoint. Must have an access token in the request header.' })
  } else {
    console.error(`Error is: \n ${stringifySafe(err)} ...\n Incoming request was ${JSON.stringify(req.body)}`)
    res.status(500).json({ errorMessage: 'Something broke!' })
  }
}

export function logger(req: Request, res: Response, next: NextFunction) {
  next()
}

type AsyncHandlerFunc = (req: Request, res: Response, next: NextFunction) => any

// Generic async handler for Express Middleware
export const asyncHandler = (fn: AsyncHandlerFunc) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

/** Thie middleware checks that the header of the request has a valid app api-key */
export function requireApiKeyMiddleware() {
  return asyncHandler(async (req: any, res: Response, next: NextFunction) => {
    const apiKeyHeader = req.headers['api-key'] as string
    if (!apiKeyHeader) {
      res.status(401).json({ errorMessage: `This is a secured endpoint. You are missing an api-key header.` })
      return
    }
    next()
  })
}
