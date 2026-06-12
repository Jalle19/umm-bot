import { Message, MessageThread } from './types'
import { parseMessage } from './parser'

export class UmmClient {
  BASE_URL = 'https://ummapi.nordpoolgroup.com'

  public async getMessage(messageId: string, version: number): Promise<Message> {
    console.info(`Looking up message ${messageId}, version ${version}`)
    const response = await fetch(`${this.BASE_URL}/messages/${messageId}/${version}`)
    const rawMessage = await response.text()

    return parseMessage(rawMessage)
  }
}
