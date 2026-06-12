import { GenerationUnit, Message, ProductionUnit, TimePeriod } from './types'

export const parseMessage = (rawMessage: unknown): Message => {
  // Marshall to JSON and back so we can convert timestamps to Dates in nested structures too
  return JSON.parse(JSON.stringify(rawMessage), (key, value) => {
    const dateFields = ['eventStart', 'eventStop', 'publicationDate']

    if (dateFields.includes(key)) {
      return new Date(value)
    }

    return value
  }) as Message
}

export const getBestTimePeriod = (timePeriods: TimePeriod[]): TimePeriod | undefined => {
  return timePeriods.find((timePeriod) => timePeriod.eventStop.getTime() > new Date().getTime())
}

export const getProductionUnavailabilityUnits = (message: Message): ProductionUnit[] | GenerationUnit[] => {
  if (message.productionUnits) {
    return message.productionUnits
  } else if (message.generationUnits) {
    return message.generationUnits
  }

  return []
}

export const getProductionUnitName = (unit: ProductionUnit | GenerationUnit): string => {
  if ((unit as GenerationUnit).productionUnitName) {
    const generationUnit = unit as GenerationUnit
    return `${generationUnit.productionUnitName} ${generationUnit.name}`
  }

  return unit.name
}
