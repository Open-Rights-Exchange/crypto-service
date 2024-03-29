import { now } from 'lodash'
import Rollbar from 'rollbar'
import { CONSTANTS } from '../backend/constants' // TODO: should be passed in constructor
import { getRollbar } from '../backend/services/rollbar/connectors'
import { toBool } from './conversion'
import { stringifySafe } from './parsing'

type LoggerParams = {
  tracingEnabled?: boolean
  rollbar: Rollbar
  processId: string
}

export class Logger {
  tracingEnabled: boolean

  rollbar: Rollbar

  processId: string

  constructor(params: LoggerParams) {
    this.tracingEnabled = params?.tracingEnabled || false
    this.rollbar = params?.rollbar
    this.processId = params?.processId
  }

  // if traceOnly is true, then this log entry is only created when TRACING_ENABLED (in env) is set to true
  log(message: string, data?: any, error?: Error, traceOnly = false) {
    const TRACING_ENABLED = toBool(this.tracingEnabled) || false
    // only log this when tracing enabled
    if (traceOnly === true && !TRACING_ENABLED) {
      return
    }
    let err = ''
    if (error) {
      err = ' - Error: '

      if (error instanceof Error) {
        err += `${error.name}: ${error.message}`
      } else {
        // this handles circular references in json
        err += stringifySafe(error)
      }
    }

    const dataString = data ? stringifySafe(data) : ''
    // construct message
    const logMessage = `${message}${dataString}${err}\n`
    const processIdMessage = `PROCESS_ID: ${this.processId}`
    const localLogMessage = `${now()} - ${logMessage} - ${processIdMessage}`
    const remoteLogMessage = `${logMessage} - ${processIdMessage}`
    console.log(localLogMessage)
    // Log to Rollbar
    if (typeof this.rollbar === 'undefined') {
      // eslint-disable-line no-undef
      return
    }
    if (error) {
      this.rollbar.info(remoteLogMessage, { ...data, processId: this.processId, level: 'error' }) // eslint-disable-line no-undef
    } else if (traceOnly === true) {
      this.rollbar.info(remoteLogMessage, { ...data, processId: this.processId, level: 'debug' }) // eslint-disable-line no-undef
    } else {
      this.rollbar.info(remoteLogMessage, { ...data, processId: this.processId, level: 'info' }) // eslint-disable-line no-undef
    }
  }

  trace(message: string, data?: any) {
    this.log(message, data, null, true)
  }

  error(message: string, error?: Error) {
    console.error(error) // Developers need to see error details!
    this.log(message, null, error, false)
  }

  // Log error and throw an error with provided message
  logAndThrowError(message: string, error?: Error) {
    this.error(message, error)
    throw error || new Error(message || 'Something broke :(')
  }
}

// ==== Global logger ====

const globalloggerSettings = {
  rollbar: getRollbar(CONSTANTS), // fallback to service constants
  tracingEnabled: false,
  processId: CONSTANTS.DEFAULT_PROCESS_ID,
}

/** Logger that runs before a request context is created */
export const globalLogger = new Logger({ ...globalloggerSettings })
