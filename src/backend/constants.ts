/* eslint-disable prefer-destructuring */
// Environment settings - stored in a .env file in the root of the app (not stored in GitHub)
// require('dotenv-webpack');
import { Base64 } from 'js-base64'

require('dotenv').config()

const settings = process.env

export const ENVIRONMENT = settings.ENVIRONMENT ? settings.ENVIRONMENT : settings.NODE_ENV

// Global constants
export const APP_NAME = 'crypto-service'
export const MIN_REQUIRED_WALLET_PASSWORD_LENGTH = 4
export const MONGO_TIMEOUT: number = Number(process.env.MONGO_TIMEOUT) || 15000
export const DEFAULT_PROCESS_ID = 'GLOBAL_CONTEXT_PROCESS_ID_MISSING'
export const SEGMENT_WRITE_KEY = settings.SEGMENT_WRITE_KEY
export const ROLLBAR_POST_WRITE_SERVER_KEY = settings.ROLLBAR_POST_WRITE_SERVER_KEY

export const BASE_PUBLIC_KEY = settings.BASE_PUBLIC_KEY
export const BASE_PRIVATE_KEY = settings.BASE_PRIVATE_KEY

// Invalid PIN Attempt
export const MINUTES_FOR_FIRST_LOCK = 1
export const MINUTES_FOR_SECOND_LOCK = 15
export const MINUTES_FOR_MORE_LOCK = 60
export const HOURS_FOR_TIMEOUT_LOCK = 24

// Misc
export const RECAPTCHA_SERVER_KEY = settings.RECAPTCHA_SERVER_KEY
export const APP_ACCESS_TOKEN_EXPIRATION_IN_SECONDS = 120

if (!settings.BASE_PUBLIC_KEY || !settings.BASE_PRIVATE_KEY) {
  throw new Error('Make sure you have environment settings in an .env file in the root directory of the app')
}
