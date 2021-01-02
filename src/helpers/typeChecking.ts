export function isAString(value: any) {
  if (!value) {
    return false
  }
  return typeof value === 'string' || value instanceof String
}

export function isADate(value: any) {
  return value instanceof Date
}

export function isABoolean(value: any) {
  return typeof value === 'boolean' || value instanceof Boolean
}

export function isANumber(value: any) {
  if (Number.isNaN(value)) return false
  return typeof value === 'number' || value instanceof Number
}

export function isAnObject(value: any) {
  return value !== null && typeof value === 'object'
}

export function isNullOrEmpty(value: any) {
  if (value === undefined) {
    return true
  }
  if (value === null) {
    return true
  }
  // Check for an empty array too
  // eslint-disable-next-line no-prototype-builtins
  if (value.hasOwnProperty('length')) {
    if (value.length === 0) {
      return true
    }
  }
  return Object.keys(value).length === 0 && value.constructor === Object
}
