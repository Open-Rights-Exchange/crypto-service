import { sha256 } from 'js-sha256'
import { createGuid, createGuidWithoutDashes } from './uuidGenerator'
import { isNullOrEmpty } from './typeChecking'

/** Returns a property on a JSON object
 *  e.g. name = prop(myObject, 'name')
 * This is equivalent to name = myobject[name]  ... but allowed by Typescript */
export function prop<T, K extends keyof T>(obj: T, key: K) {
  return obj[key]
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

/** maps standard timestap fields to fully-typed */
export function mapTimestamp(data: any) {
  const { createdOn, createdBy, updatedOn, updatedBy } = data
  return { createdOn, createdBy, updatedOn, updatedBy }
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
 * If null or undefined, result is unchanged (e.g. still null)
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

export const notImplemented = () => {
  throw new Error('Not Implemented')
}

export const notSupported = (description: string) => {
  throw new Error(`Not Supported ${description}`)
}

/** generate a unique string for tracking multiple api calls for the same process */
export function generateProcessId() {
  const guid = createGuid()
  // get the last 12 digits of the GUID
  const processId = guid.slice(-12)
  return processId
}
