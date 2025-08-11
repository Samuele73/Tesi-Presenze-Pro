export interface day_work {
  project: string;
  hour_from: string;
  hour_to: string;
  date_from?: object;
}

export interface request {
  request_type: string;
  date_from: string;
  date_to: string;
  time_from: string;
  time_to: string;
}

export interface working_trip {
  from: string;
  to: string;
}

export interface availability {
  from: string;
  to: string;
  project: string;
}

export interface calendar {
  day_works: day_work[];
  requests: request[];
  working_trips: working_trip[];
  availabilities: availability[];
}

export interface apiEntry {
  entryType: entryType;
  entry: any; //IMPORTANTE: Creare tutti i tipi del server. poi ricorda di spostare tutte quest interfacce su un models apposito e non lasciarlo in questo file
}
//TO DO: meglio far si che entry sia un array. in modo da avere direttamente tutte le entries di quel tipo in un unico array

export type entryType =
  | 'WORKING_TRIP'
  | 'WORKING_DAY'
  | 'REQUEST'
  | 'AVAILABILITY';
