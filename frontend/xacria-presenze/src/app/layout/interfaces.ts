import { Time } from "@angular/common"

//Interfacce per le entries del calendario

//Conforme a quella presente nel backend
export enum CalendarEntryType {
  WORKING_DAY = "WORKING_DAY",
  REQUEST = "REQUEST",
  WORKING_TRIP = "WORKING_TRIP",
  AVAILABILITY = "AVAILABILITY"
}

export interface CalendarAvailabilityEntry {
  date_from: Date,
  date_to: Date,
  project: string
}

export interface CalendarRequestEntry{
  request_type: string,
  date_from: Date,
  date_to: Date,
  time_from: string,
  time_to: string
}


//Date_from e date_to sono necessari per essere visualizzati nelle notifiche del calendario
export interface CalendarDayWorkEntry{
  project: string,
  hour_from: string,
  hour_to: string,
  date_from?: Date,
  date_to?: Date
}

export interface CalendarWorkingTripEntry{
  date_from: Date,
  date_to: Date
}
