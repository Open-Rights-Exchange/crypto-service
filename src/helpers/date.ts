export function now() {
  return new Date()
}

export function lastMidnight() {
  const date = now()
  date.setHours(0, 0, 0, 0)
  return date
}

// checks if dateTimeString parses to a valid date
export function isValidDate(dateTime: any) {
  if (dateTime == null) return false
  // If it's a date object check if its valid
  if (dateTime instanceof Date) {
    return !Number.isNaN(dateTime.getTime())
  }
  // Otherwise try to parse it
  const dateNumber = Date.parse(dateTime)
  return !Number.isNaN(dateNumber) // A valid number here means a valid date
}

export function tryParseDate(dateString: any) {
  if (!dateString) return null
  const dateNumber = Date.parse(dateString)
  if (Number.isNaN(dateNumber) || dateNumber == null) return null
  return new Date(dateNumber)
}
