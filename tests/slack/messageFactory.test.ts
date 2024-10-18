import { expect, it } from '@jest/globals'
import { readAndParseResource } from '../utils'
import { createProductionUnavailabilityMessage } from '../../src/slack/messageFactory'

it('throws error if no suitable time period found', () => {
  const message = readAndParseResource('tests/resources/production.onlyPastTimePeriods.json')

  expect(() => createProductionUnavailabilityMessage(message)).toThrowError('No suitable time period found')
})
