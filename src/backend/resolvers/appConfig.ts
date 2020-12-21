import { isNullOrEmpty, toBool } from 'aikon-js'
import { Context, ErrorType } from '../models'
import { AppRegistrationData, AppConfigData, AppConfigType, Mongo } from '../models/data'
import { ServiceError } from './errors'
import { findOneMongo } from '../services/mongo/resolvers'

const appTokenCache: { [key: string]: any } = {}

export type GetAppConfigParams = {
  type: AppConfigType
  name: string
}

/**
 * Retrieve a single app setting value
 */
export async function getAppConfig(params: GetAppConfigParams, context: Context): Promise<string> {
  const { type, name } = params
  const { appId } = context
  const appConfig = await findOneMongo<AppConfigData>({
    context,
    mongoObject: Mongo.AppConfig,
    filter: { appId, type, name },
  })
  if (isNullOrEmpty(appConfig)) {
    throw new ServiceError(`Can't find config ${type} name:${name}`, ErrorType.AppConfig, `getAppConfig appId:${appId}`)
  }

  return appConfig.value as string
}

/**
 * Lookup the appId matching the provided API Key
 * If missing or invalid, throws an error
 * Caches key in order to limit hits against the DB */
export async function getAppIdFromApiKey(apiKey: string, context: Context) {
  if (isNullOrEmpty(apiKey)) {
    const msg = 'Missing required header parameter: api-key'
    throw new ServiceError(msg, ErrorType.AppConfig, 'getAppIdFromApiKey')
  }

  // Look in cache first
  let appId = appTokenCache[apiKey]
  if (!isNullOrEmpty(appId)) {
    return appId
  }

  // lookup appId by apiKey - NOTE: Expects apiKey to be unique across all apps
  const filter = { apiKeys: { $elemMatch: { apiKey } } }
  const appRegistration = await findOneMongo<AppRegistrationData>({
    mongoObject: Mongo.AppRegistration,
    context,
    filter,
  })
  if (isNullOrEmpty(appRegistration)) {
    throw new ServiceError("api-key isn't valid", ErrorType.AppConfig, `getAppIdFromApiKey: appid${appId}`)
  }

  appId = appRegistration._id
  appTokenCache[apiKey] = appId
  return appId
}
