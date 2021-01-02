import { Base64 } from 'js-base64'
import { parse, stringify } from 'flatted/cjs'
import { isAString } from './typeChecking'

/** Replace all occurences of a value in a string to a new value */
export function replaceAllInString(string: string, search: string, newValue: string) {
  return string.split(search).join(newValue)
}

/** Returns Null if parse fails */
export function tryParseJSON(jsonString: string, unescape = false, replaceQuotes = false) {
  let finalJsonString = ''
  if (!jsonString || !isAString(jsonString) || jsonString.trim() === '') return null
  try {
    if (unescape) {
      jsonString = decodeURI(jsonString)
    }
    finalJsonString = jsonString
    if (replaceQuotes) {
      // eslint-disable-next-line quotes
      finalJsonString = replaceAllInString(jsonString, "'", '"')
      finalJsonString = replaceAllInString(finalJsonString, '`', '"')
    }
    const o = JSON.parse(finalJsonString, jsonParseComplexObjectReviver)
    // Handle non-exception-throwing cases:
    // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
    // but... JSON.parse(null) returns null, and typeof null === "object",
    // so we must check for that, too. Thankfully, null is falsey, so this suffices:
    if (o && typeof o === 'object') {
      return o
    }
  } catch (error) {
    // TODO log issue
  }

  return null
}

/**
 * The reviver function passed into JSON.parse to implement custom type conversions.
 * If the value is a previously stringified buffer we convert it to a Buffer, otherwise return the value
 */
export function jsonParseComplexObjectReviver(key: string, value: any) {
  // Convert Buffer
  if (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    value.type === 'Buffer' &&
    'data' in value &&
    Array.isArray(value.data)
  ) {
    return Buffer.from(value.data)
  }

  // Return parsed value without modifying
  return value
}

// uses flatted library to allow stringifing on an object with circular references
// NOTE: This does not produce output similar to JSON.stringify, it has it's own format
// to allow you to stringify and parse and get back an object with circular references
export function stringifySafe(obj: any) {
  return stringify(obj)
}

// this is the inverse of stringifySafe
// if converts a specially stringifyied string (created by stringifySafe) back into an object
export function parseSafe(string: any) {
  return parse(string)
}

export function base64Encode(value: any) {
  return Base64.encode(value)
}

export function base64Decode(value: any) {
  return Base64.decode(value)
}

/** return null if can't encode - don't throw error */
export function tryBase64Encode(value: any) {
  try {
    return Base64.encode(value)
  } catch (err) {
    return null
  }
}

/** return null if can't decode - don't throw error */
export function tryBase64Decode(value: any): any {
  try {
    return Base64.decode(value)
  } catch (err) {
    return null
  }
}
