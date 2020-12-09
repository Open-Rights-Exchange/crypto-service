import { Storage } from '@google-cloud/storage'

import { GOOGLE_CLOUD_SERVICE_ACCT, GOOGLE_CLOUD_PROJECT_NAME } from '../../constants'
import { logger } from '../../utils/helpers'

export function createGoogleStorage() {
  try {
    const googleStorage = new Storage({
      projectId: GOOGLE_CLOUD_PROJECT_NAME,
      credentials: GOOGLE_CLOUD_SERVICE_ACCT,
    })
    return googleStorage
  } catch (error) {
    logger.error('Problem creating google storage instance:', error)
  }
  return null
}
