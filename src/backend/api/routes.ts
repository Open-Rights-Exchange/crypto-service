import express, { Express, Request, Response, NextFunction } from 'express'
import { asyncHandler } from '../../server/serverAuth'
import { v1Admin } from './controllers/admin'
import { v1Root } from './controllers/root'
import { healthCheckHandler } from './healthCheckHandler'
import { wellknown } from './controllers/wellknown'
import { Config } from '../../models'

/** Create an express Router and add its routes to the Express instance */
export function addRoutesToExpressServer(server: Express, config: Config) {
  const router = express.Router()
  router.use(
    '/health',
    asyncHandler((req: Request, res: Response, next: NextFunction) => {
      healthCheckHandler(req, res, next, config)
    }),
  )
  router.use(
    '/admin',
    asyncHandler((req: Request, res: Response, next: NextFunction) => {
      v1Admin(req, res, next, config)
    }),
  )
  router.use(
    '/:action',
    asyncHandler((req: Request, res: Response, next: NextFunction) => {
      v1Root(req, res, next, config)
    }),
  )
  server.use(router)
}
