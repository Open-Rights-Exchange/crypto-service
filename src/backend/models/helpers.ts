import { isAString, tryParseJSON, isAnObject } from 'aikon-js'
import { isInEnum, throwNewError } from '../utils/helpers'
import { ChainType } from './general'

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

/** throws if chainType string isnt a valid value in ChainType enum  */
export function assertValidChainType(chainType: string): void {
  if (!isInEnum(ChainType, chainType)) {
    throwNewError(`Invalid chainType: '${chainType}'.`)
  }
}
