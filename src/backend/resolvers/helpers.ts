import { createGuidWithoutDashes } from 'aikon-js'

export function createGuidWithPrefix(prefix = '') {
  return `${prefix}${createGuidWithoutDashes()}`
}
