import { GenerationUnit, Message, ProductionUnit, PushNotificationMessage, TimePeriod } from "./types";

export const parsePushMessage = (rawMessage: unknown): PushNotificationMessage => {
  return {
    MessageId: (rawMessage as any).MessageId,
    Version: (rawMessage as any).Version,
  }
}

export const parseMessage = (rawMessage: string): Message => {
  return JSON.parse(rawMessage, (key, value) => {
    // Convert timestamps to Date
    const dateFields = ['eventStart', 'eventStop', 'publicationDate']

    if (dateFields.includes(key)) {
      return new Date(value)
    }

    return value
  })
}

export const getBestTimePeriod = (timePeriods: TimePeriod[]): TimePeriod | undefined => {
  return timePeriods.find(timePeriod => timePeriod.eventStop.getTime() > (new Date()).getTime())
}

export const getProductionUnitName = (unit: ProductionUnit | GenerationUnit): string => {
  if ((unit as GenerationUnit).productionUnitName) {
    const generationUnit = unit as GenerationUnit;
    return `${generationUnit.productionUnitName} ${generationUnit.name}`
  }

  return unit.name
}
