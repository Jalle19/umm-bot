import { EventStatus, Message, MessageType, UnavailabilityType } from '../umm/types'
import { getProductionUnavailabilityUnits } from '../umm/parser'

export const isDismissedMessage = (ummMessage: Message): boolean => {
  return ummMessage.eventStatus === EventStatus.Dismissed
}

export const isInterestingProductionUnavailabilityMessage = (ummMessage: Message): boolean => {
  if (ummMessage.messageType !== MessageType.ProductionUnavailability) {
    return false
  }

  // Units have to be in Finland
  const units = getProductionUnavailabilityUnits(ummMessage)
  if (!units.some((unit) => unit.areaName === 'FI')) {
    return false
  }

  return ummMessage.unavailabilityType === UnavailabilityType.Unplanned
}

export const isInterestingTransmissionUnavailabilityMessage = (ummMessage: Message): boolean => {
  if (ummMessage.messageType !== MessageType.TransmissionUnavailability) {
    return false
  }

  // One of the areas must be in Finland
  if (!ummMessage.transmissionUnits?.some((unit) => unit.inAreaName === 'FI' || unit.outAreaName === 'FI')) {
    return false
  }

  // We're ony interested in unplanned outages
  return ummMessage.unavailabilityType === UnavailabilityType.Unplanned
}
