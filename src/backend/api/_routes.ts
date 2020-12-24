import express, { Request, Response, NextFunction } from 'express'

import { asyncHandler } from '../../server/server_auth'
import { v1Admin } from './controllers/admin'
import { v1Root } from './controllers/root'
import { healthCheckHandler } from './healthCheckHandler'
import { wellknown } from './controllers/wellknown'

const router = express.Router()
router.use(
  '/admin',
  asyncHandler((req: Request, res: Response, next: NextFunction) => {
    v1Admin(req, res, next)
  }),
)
router.use(
  '/:action',
  asyncHandler((req: Request, res: Response, next: NextFunction) => {
    v1Root(req, res, next)
  }),
)
router.use(
  '/health',
  asyncHandler((req: Request, res: Response, next: NextFunction) => {
    healthCheckHandler(req, res, next)
  }),
)

// seperate ro for each specific '.well-known' file so we don't intefere with others we don't handle explicitly (eg manifest.json)
router.get(
  '/.well-known/apple-developer-domain-association.txt',
  asyncHandler((req: Request, res: Response, next: NextFunction) => {
    wellknown('apple-developer-domain-association.txt', req, res, next)
  }),
)

export { router }
