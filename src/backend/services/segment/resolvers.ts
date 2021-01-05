import Segment from 'analytics-node'
import { isAString } from '../../../helpers'
import { AnalyticsEvent } from '../../../models'

export class Analytics {
  _processId: string

  _segment: Segment

  constructor(segmentWriteKey: string, processId: string) {
    this._segment = new Segment(segmentWriteKey)
    this._processId = processId
  }

  /**
   * Sends AnalyticsEvents. The `eventName` param is an AnalyticsEvent
   * processId wil be added to eventMetadata (if not already in eventMetadata)
   */
  event(userId: string, eventName: AnalyticsEvent, eventMetadata: any = {}, processId?: string) {
    const eventString = isAString(eventName) ? eventName : eventName.toString()

    // set processId (if not provided in metadata)
    eventMetadata.processId = eventMetadata.processId || processId || this._processId

    this._segment.track({
      event: eventString,
      properties: eventMetadata,
      userId,
    })
  }
}
