export type PushNotificationMessage = {
  MessageId: string
  Version: number
}

export type MessageThread = Message[]

export type Message = {
  messageId: string
  version: number
  isOutdated: boolean
  publicationDate: Date
  messageType: MessageType
  eventStatus: EventStatus
  unavailabilityType?: UnavailabilityType
  reasonCode?: ReasonCode
  unavailabilityReason?: string
  remarks: string
  otherMarketUnits?: string
  cancellationReason?: string
  publisherId: string
  publisherName: string
  eventStart: Date
  eventStop: Date
  areas: Area[]
  assets?: Asset[]
  marketParticipants?: MarketParticipant[]
  productionUnits?: ProductionUnit[]
  generationUnits?: GenerationUnit[]
  consumptionUnits?: ConsumptionUnit[]
  transmissionUnits?: TransmissionUnit[]
  otherUnits?: OtherUnit[]
}

export enum MessageType {
  ProductionUnavailability = 1,
  ConsumptionUnavailability,
  TransmissionUnavailability,
  OtherUnavailability,
  MarketInformation,
}

export enum EventStatus {
  Unplanned = 1,
  Planned,
}

export enum UnavailabilityType {
  Unplanned = 1,
  Planned
}

export enum ReasonCode {
  Failure = 1,
  ForeseenMaintenance
}

type Eic = string

interface NameCodeThing {
  name: string
  code: Eic
}

interface Area extends NameCodeThing {

}

interface Asset extends NameCodeThing {

}

interface MarketParticipant extends NameCodeThing {
  acerCode: string
  eicCode: Eic
  leiCode: string
}

export interface Unit {
  name: string
  installedCapacity: number
  timePeriods: TimePeriod[]
}

interface Locatable {
  areaName: string
  areaEic: string
}

export interface ProductionUnit extends Unit, Locatable {
  eic: Eic
  fuelType: FuelType
  powerFeedIn: number
}

export interface GenerationUnit extends ProductionUnit, Locatable {
  productionUnitName: string
  productionUnitEic: string
  productionUnitInstalledCapacity: number
}

export interface ConsumptionUnit extends Unit, Locatable {
  eic: Eic
}

export interface TransmissionUnit extends Unit {
  inAreaName: string
  inAreaEic: Eic
  outAreaName: string
  outAreaEic: Eic
}

export interface OtherUnit extends Unit, Locatable {
  eic: Eic
}

export type TimePeriod = {
  availableCapacity: number
  unavailableCapacity: number
  eventStart: Date
  eventStop: Date
}

enum FuelType {
  Biomass = 1,
  FossilBrownCoalLignite,
  FossilCoalDerivedGas,
  FossilGas,
  FossilHardCoal,
  FossilOil,
  FossilOilShale,
  FossilPeat,
  Geothermal,
  HydroPumpedStorage,
  HydroRunOfRiverAndPoundage,
  HydroWaterReservoir,
  Marine,
  Nuclear,
  OtherRenewable,
  Solar,
  Waste,
  WindOffshore,
  WindOnshore,
  Other = 100
}
