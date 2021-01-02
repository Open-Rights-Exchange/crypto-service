import Analytics from 'analytics-node'
import { isAString } from '../../../helpers'
import { AnalyticsEvent, Context } from '../../../models'
import { SEGMENT_WRITE_KEY } from '../../constants'

const analytics = new Analytics(SEGMENT_WRITE_KEY)

/**
 * Sends AnalyticsEvents
 *
 * The `eventName` param is an AnaylticsEvent or string containing `chain_action_` or `user_action_`
 * processId wil be added to eventMetadata from context (if not already in eventMetadata)
 *
 * @param userId
 * @param eventName
 * @param eventMetadata
 */
export function analyticsEvent(
  userId: string,
  eventName: AnalyticsEvent | string,
  eventMetadata: any = {},
  context: Context,
) {
  const eventString = isAString(eventName) ? eventName : eventName.toString()

  // set processId from context (if not provided in metadata)
  const processIdFromContext = context?.processId
  if (!eventMetadata?.processId && processIdFromContext) {
    eventMetadata.processId = processIdFromContext
  }

  analytics.track({
    event: eventString,
    properties: eventMetadata,
    userId,
  })
}
