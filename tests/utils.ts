import { Message } from '../src/umm/types'
import fs from 'node:fs'
import { parseMessage } from '../src/umm/parser'

export const readAndParseResource = (resource: string): Message => {
  const raw = fs.readFileSync(resource)

  return parseMessage(raw.toString('utf8'))
}
