import path from 'path'
import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { APP_NAME } from '../constants'
import { ContextGlobal } from '../../helpers'

dotenv.config()
// read the deploy_version file and add to process.env
// deploy_version is created by build script
dotenv.config({ path: path.resolve(process.cwd(), 'deploy-version') })

const { performance } = require('perf_hooks')

// measure how long a call takes to complete
const timed = (f: (...args: any[]) => any) => async (...args: any) => {
  const start = performance.now()
  const result = await f(...args)
  const end = performance.now()
  const timeElapsed = `${(end - start).toFixed(4)}`
  return { ...result, timeElapsed }
}

export async function healthCheckHandler(req: Request, res: Response, next: NextFunction) {
  const { logger } = ContextGlobal

  const response: any = {
    service: APP_NAME,
    datetime: new Date().toISOString(),
    envVersion: process.env.ENV_VERSION,
    // ENV vars from deploy_version file created by circle.yml
    buildVersion: process.env.BUILD_VERSION,
    deployDate: process.env.DEPLOY_DATE,
    envHash: process.env.ENV_HASH,
  }

  try {
    response.someTimedAction = (
      await timed(async () => {
        const performSomeFunction = ''
      })()
    ).timeElapsed
  } catch (error) {
    logger.error('error while running healthCheck', error)
  }
  res.status(200).json(response)
  logger.trace('healthCheck endpoint called', response)
}
