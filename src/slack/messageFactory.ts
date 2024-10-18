import { GenerationUnit, Message, ProductionUnit, TransmissionUnit, UnavailabilityType, Unit } from '../umm/types'
import { AnyBlock, DividerBlock, SectionBlock } from '@slack/web-api'
import { getBestTimePeriod, getProductionUnitName } from '../umm/parser'

const areaFlagMap: Map<string, string> = new Map([
  ['FI', 'flag-fi'],
  ['EE', 'flag-ee'],
  ['RU', 'flag-ru'],
  ['SE1', 'flag-se'],
  ['SE2', 'flag-se'],
  ['SE3', 'flag-se'],
  ['SE4', 'flag-se'],
  ['NO1', 'flag-se'],
  ['NO2', 'flag-se'],
  ['NO3', 'flag-se'],
  ['NO4', 'flag-se'],
  ['NO5', 'flag-se'],
])

const createEventSection = (message: Message, unit?: Unit): SectionBlock => {
  const plannedText = message.unavailabilityType === UnavailabilityType.Planned ? 'Planned' : 'Unplanned'
  const timePeriod = unit ? getBestTimePeriod(unit.timePeriods) : undefined

  if (!timePeriod) {
    throw new Error('No suitable time period found')
  }

  return {
    'type': 'section',
    'fields': [
      {
        'type': 'mrkdwn',
        'text': `*Event start*\n${timePeriod.eventStart}`,
      },
      {
        'type': 'mrkdwn',
        'text': `*Event stop*\n${timePeriod.eventStop}`,
      },
      {
        'type': 'mrkdwn',
        'text': `*Type*\n${plannedText}`,
      },
      {
        'type': 'mrkdwn',
        'text': `*Reason*\n${message.unavailabilityReason}`,
      },
      {
        'type': 'mrkdwn',
        'text': `*Remarks*\n${message.remarks ?? 'N/A'}`,
      },
    ],
  }
}

const createMoreInfoSection = (message: Message): SectionBlock => {
  return {
    'type': 'section',
    'text': {
      'type': 'mrkdwn',
      'text': `More information: https://umm.nordpoolgroup.com/#/messages/${message.messageId}/${message.version}`,
    },
  }
}

const createTransmissionUnitSection = (unit: TransmissionUnit): AnyBlock => {
  let areaText = `${unit.inAreaName} -> ${unit.outAreaName}`

  // Add flags if we have them
  const inFlag = areaFlagMap.get(unit.inAreaName)
  const outFlag = areaFlagMap.get(unit.outAreaName)
  if (inFlag && outFlag) {
    areaText = `:${inFlag}: ${unit.inAreaName} -> :${outFlag}: ${unit.outAreaName}`
  }

  const timePeriod = getBestTimePeriod(unit.timePeriods)
  const available = timePeriod ? `${timePeriod.availableCapacity} MW` : '~'
  const unavailable = timePeriod ? `${timePeriod.unavailableCapacity} MW` : '~'

  return {
    'type': 'section',
    'fields': [
      {
        'type': 'mrkdwn',
        'text': `*Area*\n${areaText}`,
      },
      {
        'type': 'mrkdwn',
        'text': `*Capacity*\n${unit.installedCapacity} MW`,
      },
      {
        'type': 'mrkdwn',
        'text': `*Available*\n${available}`,
      },
      {
        'type': 'mrkdwn',
        'text': `*Unavailable*\n${unavailable}`,
      },
    ],
  }
}

const createProductionUnitSection = (unit: ProductionUnit | GenerationUnit): SectionBlock => {
  const areaFlag = areaFlagMap.get(unit.areaName)
  const timePeriod = getBestTimePeriod(unit.timePeriods)
  const available = timePeriod ? `${timePeriod.availableCapacity} MW` : '~'
  const unavailable = timePeriod ? `${timePeriod.unavailableCapacity} MW` : '~'
  const unitName = getProductionUnitName(unit)
  const name = areaFlag ? `:${areaFlag}: ${unitName}` : unitName

  return {
    'type': 'section',
    'fields': [
      {
        'type': 'mrkdwn',
        'text': `*Name*\n${name}`,
      },
      {
        'type': 'mrkdwn',
        'text': `*Capacity*\n${unit.installedCapacity} MW`,
      },
      {
        'type': 'mrkdwn',
        'text': `*Available*\n${available}`,
      },
      {
        'type': 'mrkdwn',
        'text': `*Unavailable*\n${unavailable}`,
      },
    ],
  }
}

const createDividerSection = (): DividerBlock => {
  return {
    'type': 'divider',
  }
}

export const createTransmissionUnavailabilityMessage = (message: Message): AnyBlock[] => {
  // New or updated?
  const messageType = message.version === 1 ? 'new' : 'update'

  const headingSection = {
    'type': 'section',
    'text': {
      'type': 'mrkdwn',
      'text': `Transmission unavailability (${messageType})`,
    },
  }

  let sections: AnyBlock[] = [
    headingSection,
    createDividerSection(),
    createEventSection(message, message.transmissionUnits?.[0]),
  ]

  const unitSections = message.transmissionUnits
    // Ignore transmissions lines not related to us
    //?.filter(unit => unit.inAreaName === 'FI' || unit.outAreaName === 'FI')
    ?.map((unit) => createTransmissionUnitSection(unit))

  if (unitSections) {
    sections.push(...unitSections)
  }

  sections.push(...[createDividerSection(), createMoreInfoSection(message)])

  return sections
}

export const createProductionUnavailabilityMessage = (message: Message): AnyBlock[] => {
  // Determine which list of units to use. The API is inconsistent here.
  let units: ProductionUnit[] | GenerationUnit[]
  if (message.productionUnits) {
    units = message.productionUnits
  } else if (message.generationUnits) {
    units = message.generationUnits
  } else {
    throw new Error('Neither production nor generation units defined')
  }

  // New or updated?
  const messageType = message.version === 1 ? 'new' : 'update'

  const headingSection = {
    'type': 'section',
    'text': {
      'type': 'mrkdwn',
      'text': `Production unavailability (${messageType})`,
    },
  }

  let sections: AnyBlock[] = [headingSection, createDividerSection(), createEventSection(message, units?.[0])]

  const unitSections = units?.map((unit) => createProductionUnitSection(unit))
  if (unitSections) {
    sections.push(...unitSections)
  }

  sections.push(...[createDividerSection(), createMoreInfoSection(message)])

  return sections
}

export const createDismissedMessageMessage = (message: Message): AnyBlock[] => {
  const cancellationReason = message.cancellationReason ?? 'N/A'

  return [
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': `:relieved: A previously issued message was cancelled. Cancellation reason: _${cancellationReason}_`,
      },
    },
    createDividerSection(),
    createMoreInfoSection(message),
  ]
}
