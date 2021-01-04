import { NextFunction, Request, Response } from 'express'
import { Config } from '../../models'
import { ContextGlobal } from './context'

const { performance } = require('perf_hooks')

// measure how long a call takes to complete
const timed = (f: (...args: any[]) => any) => async (...args: any) => {
  const start = performance.now()
  const result = await f(...args)
  const end = performance.now()
  const timeElapsed = `${(end - start).toFixed(4)}`
  return { ...result, timeElapsed }
}

export async function healthCheckHandler(req: Request, res: Response, next: NextFunction, config: Config) {
  const { constants } = config
  const { logger } = ContextGlobal

  const response: any = {
    service: constants.APP_NAME,
    datetime: new Date().toISOString(),
    envVersion: constants.ENV_VERSION,
    // ENV vars from deploy_version file created by circle.yml
    buildVersion: constants.BUILD_VERSION,
    deployDate: constants.DEPLOY_DATE,
    envHash: constants.ENV_HASH,
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
