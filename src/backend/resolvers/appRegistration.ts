import { Context, ErrorType } from '../../models'
import { AppRegistrationData, Mongo } from '../../models/data'
import { findOneMongo } from '../services/mongo/resolvers'
import { isNullOrEmpty, toBool, ServiceError } from '../../helpers'

const appTokenCache: { [key: string]: any } = {}

/**
 * Gets all the Api keys for given App ID.
 * Filters out keys that are revoked.
 */
export async function getApiKeysForAppRegistration(context: Context, appId: string): Promise<string[]> {
  const appReg = await findOneMongo<AppRegistrationData>({
    context,
    mongoObject: Mongo.AppRegistration,
    filter: { _id: appId },
  })
  if (!isNullOrEmpty(appReg)) {
    return appReg?.apiKeys
      .filter(key => {
        return !toBool(key.isRevoked)
      })
      .map(key => key.apiKey)
  }
  return []
}

/**
 * Lookup the appId matching the provided API Key
 * If missing or invalid, throws an error
 * Caches key in order to limit hits against the DB */
export async function getAppIdFromApiKey(apiKey: string, context: Context) {
  if (isNullOrEmpty(apiKey)) {
    throw new ServiceError('Missing required header parameter: api-key', ErrorType.BadParam, 'getAppIdFromApiKey')
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
    const msg = `api-key isn't valid`
    throw new ServiceError(msg, ErrorType.BadParam, 'getAppIdFromApiKey')
  }

  appId = appRegistration._id
  appTokenCache[apiKey] = appId
  return appId
}
