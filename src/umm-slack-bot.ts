import { SignalrClient } from './signalr/client'
import { getProductionUnavailabilityUnits, parsePushMessage } from './umm/parser'
import { UmmClient } from './umm/client'
import { Message, MessageType } from './umm/types'
import { WebClient } from '@slack/web-api'
import { createProductionUnavailabilityMessage, createTransmissionUnavailabilityMessage } from './slack/messageFactory'

// Verify we have what we need
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID as string | undefined
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN as string | undefined

if (!SLACK_CHANNEL_ID || !SLACK_BOT_TOKEN) {
  throw new Error('SLACK_CHANNEL_ID and SLACK_BOT_TOKEN must be defined')
}

const isInterestingProductionUnavailabilityMessage = (ummMessage: Message): boolean => {
  if (ummMessage.messageType !== MessageType.ProductionUnavailability) {
    return false
  }

  // Units have to be in Finland
  const units = getProductionUnavailabilityUnits(ummMessage)
  if (!units.some((unit) => unit.areaName === 'FI')) {
    return false
  }

  // At least one time period must start in the past, we're not interested in future planned events
  return units[0].timePeriods.some((timePeriod) => timePeriod.eventStart.getTime() < new Date().getTime())
}

const isInterestingTransmissionUnavailabilityMessage = (ummMessage: Message): boolean => {
  if (ummMessage.messageType !== MessageType.TransmissionUnavailability) {
    return false
  }

  // One of the areas must be in Finland
  if (ummMessage.transmissionUnits?.some((unit) => unit.inAreaName === 'FI' || unit.outAreaName === 'FI')) {
    return false
  }

  // At least one time period must start in the past, we're not interested in future planned events
  const unit = ummMessage.transmissionUnits?.[0]
  if (!unit) {
    return false
  }

  return unit.timePeriods.some((timePeriod) => timePeriod.eventStart.getTime() < new Date().getTime())
}

;(async () => {
  const signalrClient = new SignalrClient('https://ummws.nordpoolgroup.com', 'wss://ummws.nordpoolgroup.com')
  const ummClient = new UmmClient()
  const slackClient = new WebClient(SLACK_BOT_TOKEN)

  const handleMessage = async (message: unknown): Promise<void> => {
    const pushMessage = parsePushMessage(message)

    // Fetch the complete message from the API
    const ummMessage = await ummClient.getMessage(pushMessage.MessageId, pushMessage.Version)
    console.dir(ummMessage)

    let slackMessage
    // Send events we're interested in to Slack
    if (isInterestingProductionUnavailabilityMessage(ummMessage)) {
      slackMessage = createProductionUnavailabilityMessage(ummMessage)
    } else if (isInterestingTransmissionUnavailabilityMessage(ummMessage)) {
      slackMessage = createTransmissionUnavailabilityMessage(ummMessage)
    } else {
      console.log(`Message ${ummMessage.messageId} version ${ummMessage.version} deemed uninteresting`)
    }

    if (slackMessage) {
      const result = await slackClient.chat.postMessage({
        channel: SLACK_CHANNEL_ID,
        text: 'Urgent market message',
        blocks: slackMessage,
      })

      console.dir(result)
    }
  }

  signalrClient.subscribeHub('MessageHub', {
    newMessage: handleMessage,
    updateMessage: handleMessage,
  })

  await signalrClient.start()
})()
