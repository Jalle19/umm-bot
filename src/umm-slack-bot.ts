import { SignalrClient } from './signalr/client'
import { parsePushMessage } from './umm/parser'
import { UmmClient } from './umm/client'
import { WebClient } from '@slack/web-api'
import { createProductionUnavailabilityMessage, createTransmissionUnavailabilityMessage } from './slack/messageFactory'
import {
  isInterestingProductionUnavailabilityMessage,
  isInterestingTransmissionUnavailabilityMessage,
} from './slack/classifier'

// Verify we have what we need
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID as string | undefined
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN as string | undefined

if (!SLACK_CHANNEL_ID || !SLACK_BOT_TOKEN) {
  throw new Error('SLACK_CHANNEL_ID and SLACK_BOT_TOKEN must be defined')
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
