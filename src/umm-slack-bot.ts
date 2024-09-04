import { SignalrClient } from './signalr/client'
import { parsePushMessage } from './umm/parser'
import { UmmClient } from './umm/client'
import { MessageType } from "./umm/types";
import { WebClient } from "@slack/web-api";
import { createProductionUnavailabilityMessage, createTransmissionUnavailabilityMessage } from "./slack/messageFactory";

// Verify we have what we need
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID as string | undefined
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN as string | undefined

if (!SLACK_CHANNEL_ID || !SLACK_BOT_TOKEN) {
  throw new Error('SLACK_CHANNEL_ID and SLACK_BOT_TOKEN must be defined')
}

(async () => {
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
    if (ummMessage.messageType === MessageType.ProductionUnavailability) {
      if (ummMessage.productionUnits?.some(unit => unit.areaName === 'FI') ||
          ummMessage.generationUnits?.some(unit => unit.areaName === 'FI')) {
        slackMessage = createProductionUnavailabilityMessage(ummMessage)
      }
    } else if (ummMessage.messageType === MessageType.TransmissionUnavailability) {
      if (ummMessage.transmissionUnits?.some(unit => unit.inAreaName === 'FI' || unit.outAreaName === 'FI')) {
        slackMessage = createTransmissionUnavailabilityMessage(ummMessage)
      }
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
