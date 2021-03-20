/* eslint-disable prefer-destructuring */
// Environment settings - stored in a .env file in the root of the app (not stored in GitHub)
import path from 'path'
import dotenv from 'dotenv'
import { ServiceError } from '../helpers/errors'
import { Constants } from '../models'

dotenv.config()

const settings = process.env

if (!settings.BASE_PUBLIC_KEY || !settings.BASE_PRIVATE_KEY) {
  throw new ServiceError('Make sure you have environment settings in an .env file in the root directory of the app')
}

// Adds ENV vars from deploy_version file created by circle.yml
dotenv.config({ path: path.resolve(process.cwd(), 'deploy-version') })

export const CONSTANTS: Constants = {
  ENVIRONMENT: settings.ENVIRONMENT ? settings.ENVIRONMENT : settings.NODE_ENV,
  // Global constants
  APP_NAME: 'crypto-service',
  MONGO_TIMEOUT: Number(settings.MONGO_TIMEOUT) || 15000,
  DEFAULT_PROCESS_ID: 'GLOBAL_CONTEXT_PROCESS_ID_MISSING',
  SEGMENT_WRITE_KEY: settings.SEGMENT_WRITE_KEY,
  ROLLBAR_POST_WRITE_SERVER_KEY: settings.ROLLBAR_POST_WRITE_SERVER_KEY,
  BASE_PUBLIC_KEY: settings.BASE_PUBLIC_KEY,
  BASE_PRIVATE_KEY: settings.BASE_PRIVATE_KEY,
  // Invalid PIN Attempt
  MINUTES_FOR_FIRST_LOCK: 1,
  MINUTES_FOR_SECOND_LOCK: 15,
  MINUTES_FOR_MORE_LOCK: 60,
  HOURS_FOR_TIMEOUT_LOCK: 24,
  // Misc
  APP_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: 120,
  // Build - ENV vars from deploy_version file created by circle.yml
  ENV_VERSION: settings?.ENV_VERSION,
  BUILD_VERSION: settings?.BUILD_VERSION,
  DEPLOY_DATE: settings?.DEPLOY_DATE,
  ENV_HASH: settings?.ENV_HASH,
  TRANSPORT_KEY_EXPIRE_IN_SECONDS: 120,
}
