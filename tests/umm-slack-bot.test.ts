import { expect, it } from '@jest/globals'
import {
  isDismissedMessage,
  isInterestingProductionUnavailabilityMessage,
  isInterestingTransmissionUnavailabilityMessage,
} from '../src/slack/classifier'
import { readAndParseResource } from './utils'

it('determines that a message is dismissed', () => {
  const message = readAndParseResource('tests/resources/transmission.cancelled.json')

  expect(isDismissedMessage(message)).toEqual(true)
})

it('treats Finnish unplanned transmission outage as interesting', () => {
  const message = readAndParseResource('tests/resources/transmission.FI.unplanned.json')

  expect(isInterestingTransmissionUnavailabilityMessage(message)).toEqual(true)
})

it('treats Finnish planned transmission outage as uninteresting', () => {
  const message = readAndParseResource('tests/resources/transmission.FI.json')

  expect(isInterestingTransmissionUnavailabilityMessage(message)).toEqual(false)
})

it('treats non-Finnish transmission outage as uninteresting', () => {
  const message = readAndParseResource('tests/resources/transmission.EE.json')

  expect(isInterestingTransmissionUnavailabilityMessage(message)).toEqual(false)
})

it('treats Finnish future planned transmission outage as uninteresting', () => {
  const message = readAndParseResource('tests/resources/transmission.FI.futurePlanned.json')

  expect(isInterestingTransmissionUnavailabilityMessage(message)).toEqual(false)
})

it('treats Finnish production outage as interesting', () => {
  const message = readAndParseResource('tests/resources/production.FI.json')

  expect(isInterestingProductionUnavailabilityMessage(message)).toEqual(true)
})

it('treats non-Finnish production outage as uninteresting', () => {
  const message = readAndParseResource('tests/resources/production.SE.json')

  expect(isInterestingProductionUnavailabilityMessage(message)).toEqual(false)
})

it('treats Finnish future planned production outage as uninteresting', () => {
  const message = readAndParseResource('tests/resources/production.FI.futurePlanned.json')

  expect(isInterestingTransmissionUnavailabilityMessage(message)).toEqual(false)
})
