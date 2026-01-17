import { SignalrClient } from './signalr/client'
import { parsePushMessage } from './umm/parser'
import { UmmClient } from './umm/client'
import { ChatPostMessageArguments, WebClient } from '@slack/web-api'
import {
  createDismissedMessageMessage,
  createProductionUnavailabilityMessage,
  createTransmissionUnavailabilityMessage,
} from './slack/messageFactory'
import {
  isDismissedMessage,
  isInterestingProductionUnavailabilityMessage,
  isInterestingTransmissionUnavailabilityMessage,
} from './slack/classifier'
import yargs from 'yargs'
import { loadDatabase, persistDatabase } from './database/database'

// Read environment variables
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID as string | undefined
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN as string | undefined

if (!SLACK_CHANNEL_ID || !SLACK_BOT_TOKEN) {
  throw new Error('SLACK_CHANNEL_ID and SLACK_BOT_TOKEN must be defined')
}

// Read arguments
const argv = yargs(process.argv.slice(2))
  .usage('node $0 [options]')
  .options({
    'databasePath': {
      description: 'The path to the database file',
      demandOption: true,
      alias: 'd',
    },
  })
  .parseSync()

let databasePath = argv.databasePath as string

;(async () => {
  const signalrClient = new SignalrClient('https://ummws.nordpoolgroup.com', 'wss://ummws.nordpoolgroup.com')
  const ummClient = new UmmClient()
  const slackClient = new WebClient(SLACK_BOT_TOKEN)
  const database = await loadDatabase(databasePath)

  const handleMessage = async (message: unknown): Promise<void> => {
    const pushMessage = parsePushMessage(message)

    // Fetch the complete message from the API
    const ummMessage = await ummClient.getMessage(pushMessage.MessageId, pushMessage.Version)
    console.dir(ummMessage)

    let slackMessage
    // Send events we're interested in to Slack
    if (
      (isInterestingProductionUnavailabilityMessage(ummMessage) ||
        isInterestingTransmissionUnavailabilityMessage(ummMessage)) &&
      isDismissedMessage(ummMessage)
    ) {
      slackMessage = createDismissedMessageMessage(ummMessage)
    } else if (isInterestingProductionUnavailabilityMessage(ummMessage)) {
      slackMessage = createProductionUnavailabilityMessage(ummMessage)
    } else if (isInterestingTransmissionUnavailabilityMessage(ummMessage)) {
      slackMessage = createTransmissionUnavailabilityMessage(ummMessage)
    } else {
      console.log(`Message ${ummMessage.messageId} version ${ummMessage.version} deemed uninteresting`)
    }

    if (slackMessage) {
      let postArgs: ChatPostMessageArguments = {
        channel: SLACK_CHANNEL_ID,
        text: 'Urgent market message',
        blocks: slackMessage,
      }

      // Post to the thread of the original message if this is a new version
      if (ummMessage.version > 1 && database.messageThreads.has(ummMessage.messageId)) {
        postArgs.thread_ts = database.messageThreads.get(ummMessage.messageId)
      }

      const result = await slackClient.chat.postMessage(postArgs)

      // Associate the UMM message with the message we just posted. This will cause future updates to the message
      // to be posted to the same thread.
      if (result.ok && result.ts && !database.messageThreads.has(ummMessage.messageId)) {
        database.messageThreads.set(ummMessage.messageId, result.ts)
        await persistDatabase(database, databasePath)
      }
      console.dir(result)
    }
  }

  signalrClient.subscribeHub('MessageHub', {
    newMessage: handleMessage,
    updateMessage: handleMessage,
  })

  await signalrClient.start()

  // We need to handle signals manually
  process.on('SIGINT', () => {
    process.exit(0)
  })
})()
