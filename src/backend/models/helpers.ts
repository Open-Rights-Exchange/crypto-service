import { isAString, tryParseJSON, isAnObject } from 'aikon-js'

import { AppAccessTokenData } from '../services/mongo/models'
import { AppAccessToken } from './data'

/** This function will map AppAccessToken to fully types object */
export function mapAppAccessToken(appAccessToken: Partial<AppAccessTokenData>) {
  if (!appAccessToken) return null
  const { metadata, ...rest } = appAccessToken
  const result: Partial<AppAccessToken> = {
    ...rest,
  }
  if (metadata) {
    result.metadata = {}
    const { newAccountPassword, currentAccountPassword, secrets } = metadata
    if (currentAccountPassword) result.metadata.currentAccountPassword = currentAccountPassword as string
    if (newAccountPassword) result.metadata.newAccountPassword = newAccountPassword as string
    if (secrets)
      result.metadata.secrets = (secrets as any).map((s: any) => ({
        // type: toEnumValue(AppTokenSecretType, s.type),
        value: s.value,
      }))
  }
  return result as AppAccessToken
}

/** Convert/parse a stringified JSON object to object
 *  if incoming value is already an object, it will just be returned */
export function convertStringifiedJsonOrObjectToObject(value: any): any {
  if (isAString(value)) return tryParseJSON(value)
  return value
}

/** Convert/stringify a JSON object to a string
 *  if incoming value is already an string, it will just be returned */
export function convertObjectToStringifiedJson(value: any): any {
  if (isAnObject(value)) return JSON.stringify(value)
  return value
}

/** maps standard timestap fields to fully-typed */
export function mapTimestamp(data: any) {
  const { createdOn, createdBy, updatedOn, updatedBy } = data
  return { createdOn, createdBy, updatedOn, updatedBy }
}
