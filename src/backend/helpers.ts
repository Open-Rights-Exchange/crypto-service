import { createGuidWithoutDashes, isAString, tryParseJSON, isAnObject, Logger, isNullOrEmpty } from 'aikon-js'
import { sha256 } from 'js-sha256'
import { DEFAULT_PROCESS_ID } from './constants'
import { rollbar } from './services/rollbar/connectors'
import { ChainType, ErrorType } from './models'
import { ServiceError } from './resolvers/errors'

const loggerDefaults = {
  rollbar,
  tracingEnabled: true, // SETTINGS.TRACING_ENABLED TODO: move tracing_enabled tp global settings
  processId: DEFAULT_PROCESS_ID,
}
// Initialize without TRACING_ENABLED to avoid errors
export let logger = new Logger({ ...loggerDefaults, tracingEnabled: false })

export const ContextGlobal = {
  processId: DEFAULT_PROCESS_ID,
  logger,
}

// Re-initialize once settings are loaded
export const initLogger = () => {
  logger = new Logger({ ...loggerDefaults })
  ContextGlobal.logger = logger
}

/** Returns a property on a JSON object
 *  e.g. name = prop(myObject, 'name')
 * This is equivalent to name = myobject[name]  ... but allowed by Typescript */
export function prop<T, K extends keyof T>(obj: T, key: K) {
  return obj[key]
}

/** Typescript Typeguard to verify that the value is in the enumType specified  */
export function isInEnum<T>(enumType: T, value: any): value is T[keyof T] {
  return Object.values(enumType).includes(value as T[keyof T])
}

/** Typescript Typeguard helper to ensure that a string value can be assigned to an Enum type
 *  If a value can't be matched to a valid option in the enum, returns null (or throws if throwIfInvalid = true) */
export function toEnumValue<T>(e: T, value: any, throwIfInvalid = false): T[keyof T] {
  if (isNullOrEmpty(value)) return null
  if (isInEnum<T>(e, value)) {
    return value
  }
  const errMsg = `Value ${JSON.stringify(value)} is not a valid member of enum ${JSON.stringify(e)}.`
  if (throwIfInvalid) {
    throw new ServiceError(errMsg, ErrorType.BadParam, `toEnumValue`)
  }
  logger.error(errMsg)
  return null
}

/** convert a string number to int or 0 */
export function stringToIntOrZero(value: string) {
  let result = parseInt(value, 10)
  if (Number.isNaN(result)) result = 0
  return result
}

export function objectHasProperty(obj: object, propertyName: string) {
  return Object.keys(obj).some(key => key === propertyName)
}

/** deep delete properties that are null or empty */
export const removeEmptyValuesInJsonObject = (obj: { [x: string]: any }) => {
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === 'object') removeEmptyValuesInJsonObject(obj[key])
    // recurse
    // eslint-disable-next-line no-param-reassign
    else if (isNullOrEmpty(obj[key]) || obj[key] === 'undefined' || obj[key] === 'null') delete obj[key] // delete the property
  })
  return obj
}

/** Call the callback once for each item in the array and await for each to finish in turn */
export async function asyncForEach(array: any[], callback: (item: any, index: number, array: any[]) => Promise<any>) {
  for (let index = 0; index < array.length; index += 1) {
    // eslint-disable-next-line @typescript-eslint/semi
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array)
  }
}

/** Convert/parse a stringified JSON object to object -
 *  if incoming value is already an object, it will just be returned */
export function convertStringifiedJsonOrObjectToObject(value: any, returnNullIfObjectFails = false) {
  if (isAnObject(value)) return value
  if (isAString(value)) {
    const object = tryParseJSON(value)
    if (object) return object
  }
  if (returnNullIfObjectFails) return null
  const msg = `Could not parse value into a JSON object. Value:${JSON.stringify(value)}`
  throw new ServiceError(msg, ErrorType.ParseError, `convertStringifiedJsonOrObjectToObject`)
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

/** throws if chainType string isnt a valid value in ChainType enum  */
export function assertValidChainType(chainType: string): void {
  if (!isInEnum(ChainType, chainType)) {
    throw new ServiceError(`Invalid chainType: '${chainType}'.`, ErrorType.ChainConfig, `assertValidChainType`)
  }
}

/** Generates a SHA256 hash from a value
 *  Returns a hex-encoded result */
export function createSha256Hash(value: string) {
  const hash = sha256.create()
  hash.update(value)
  return hash.hex()
}

/**
 * Ensure that a value is wrapped in an array
 */
export function ensureArray(value: any): any[] {
  if (value && !Array.isArray(value)) {
    value = [value]
  }
  return value
}

export function createGuidWithPrefix(prefix = '') {
  return `${prefix}${createGuidWithoutDashes()}`
}
