import { isAnObject, isAString, isNullOrEmpty } from './typeChecking'
import { ServiceError } from './errors'
import { tryParseJSON } from './parsing'
import { ErrorType } from '../models'

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
  return null
}

/** convert a string number to int or 0 */
export function stringToIntOrZero(value: string) {
  let result = parseInt(value, 10)
  if (Number.isNaN(result)) result = 0
  return result
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

/** convert to boolean - handle "true" "false" "0" "1" string */
export function toBool(value: any) {
  if (value === 0) {
    return false
  }
  if (value === 1) {
    return true
  }

  if (isAString(value)) {
    if (value.toLowerCase() === 'false' || value === '0') {
      return false
    }
    if (value.toLowerCase() === 'true' || value === '1') {
      return true
    }
  }

  if (value === true) {
    return true
  }

  // everything else: null, undefined, boolean false, unknown string, objects, functions
  return false
}

function checkIfMongooseObject(obj: any) {
  if (!isAnObject(obj)) return false
  return 'toObject' in obj
}

export function flattenMongooseObject(value: any) {
  if (checkIfMongooseObject(value)) {
    return value.toObject()
  }
  return value
}

export function copyObject(source: any) {
  const result = {}
  Object.assign(result, source)
  return result
}
