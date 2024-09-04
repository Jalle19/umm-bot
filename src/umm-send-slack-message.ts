import { UmmClient } from "./umm/client";
import { WebClient } from "@slack/web-api";
import {
  MessageType,
} from "./umm/types";
import { createProductionUnavailabilityMessage, createTransmissionUnavailabilityMessage } from "./slack/messageFactory";

// Verify we have what we need
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID as string | undefined
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN as string | undefined

if (!SLACK_CHANNEL_ID || !SLACK_BOT_TOKEN) {
  throw new Error('SLACK_CHANNEL_ID and SLACK_BOT_TOKEN must be defined')
}

void (async () => {
  const ummClient = new UmmClient()
  const message = await ummClient.getMessage(String(process.env.MESSAGE_ID), Number(process.env.MESSAGE_VERSION))

  console.dir(message)

  const slackWebClient = new WebClient(SLACK_BOT_TOKEN)

  let slackMessage
  if (message.messageType === MessageType.TransmissionUnavailability) {
    slackMessage = createTransmissionUnavailabilityMessage(message)
  } else if (message.messageType === MessageType.ProductionUnavailability) {
    slackMessage = createProductionUnavailabilityMessage(message)
  }

  if (slackMessage) {
    const result = await slackWebClient.chat.postMessage({
      channel: SLACK_CHANNEL_ID,
      text: 'Urgent market message',
      blocks: slackMessage,
    })

    console.dir(result)
  }
})()
