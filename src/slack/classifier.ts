import { Message, MessageType, UnavailabilityType } from '../umm/types'
import { getProductionUnavailabilityUnits } from '../umm/parser'

const ONE_WEEK_MS = 86400 * 1000

export const isInterestingProductionUnavailabilityMessage = (ummMessage: Message): boolean => {
  if (ummMessage.messageType !== MessageType.ProductionUnavailability) {
    return false
  }

  // Units have to be in Finland
  const units = getProductionUnavailabilityUnits(ummMessage)
  if (!units.some((unit) => unit.areaName === 'FI')) {
    return false
  }

  // Planned unavailability needs to start within a week, we're not interested in outages scheduled years in advance
  if (ummMessage.unavailabilityType === UnavailabilityType.Planned) {
    return units[0].timePeriods.some(
      (timePeriod) => timePeriod.eventStart.getTime() < new Date().getTime() + ONE_WEEK_MS,
    )
  }

  return true
}

export const isInterestingTransmissionUnavailabilityMessage = (ummMessage: Message): boolean => {
  if (ummMessage.messageType !== MessageType.TransmissionUnavailability) {
    return false
  }

  // One of the areas must be in Finland
  if (!ummMessage.transmissionUnits?.some((unit) => unit.inAreaName === 'FI' || unit.outAreaName === 'FI')) {
    return false
  }

  // Planned unavailability needs to start within a week, we're not interested in outages scheduled years in advance
  if (ummMessage.unavailabilityType === UnavailabilityType.Planned) {
    const unit = ummMessage.transmissionUnits?.[0]
    if (!unit) {
      return false
    }

    return unit.timePeriods.some((timePeriod) => timePeriod.eventStart.getTime() < new Date().getTime())
  }

  return true
}
