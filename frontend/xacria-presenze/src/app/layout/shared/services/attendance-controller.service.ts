import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/shared/services/api.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { environment } from 'src/environments/environment';
import {
  calendar,
  apiEntry,
  working_trip,
  availability,
  request,
  day_work,
  entryType,
} from '../models/calendar';
import { DateFormatService } from 'src/app/shared/services/date-format.service';

@Injectable({
  providedIn: 'root',
})
export class AttendanceControllerService {
  calendar_entries!: calendar; //Elmina dopo aver integrato il server
  private API_URL: string = environment.apiUrl;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private http: HttpClient,
    private dateFormatter: DateFormatService
  ) {
    /* const userEmail = this.authService.getUserEmail();
    if(userEmail)
      userEmail.subscribe() */
    this.retrieveCalendarEntries2()
      .then((value: any) => {
        console.log('CALENDARIO VALORE PROMISE', value);
      })
      .catch((err) => {
        console.error('VALORE CALENDARIO PROMISE ERRORE', err);
      });
    this.emptyEntries(); //togliere non appena si implementa tutto tramite api
  }

  retrieveCalendarEntries(): boolean {
    return false; //Togliere se si vuole fare funzionare il localStorage (ci sono problemi di duplicazione degli inseriemnti nella app-modal nel caso di aggiornamento della pagina)
    const wtrip_entries: any = localStorage.getItem('wtrip_entries');
    const request_entries: any = localStorage.getItem('request_entries');
    const day_work_entries: any = localStorage.getItem('day_work_entries');
    if (!wtrip_entries && !request_entries && !day_work_entries) {
      console.log('non vi sono calendar entries per il mese');
      return false;
    }
    this.calendar_entries.working_trips = JSON.parse(wtrip_entries);
    this.calendar_entries.day_works = JSON.parse(day_work_entries);
    this.calendar_entries.requests = JSON.parse(request_entries);
    return true;
  }

  //This is the correct method to use!
  retrieveCalendarEntries2() {
    return new Promise<calendar>((resolve, reject) => {
      if (this.authService.token == null) reject();
      this.getAllCalendarEntries()?.subscribe(
        (entries: apiEntry[]) => {
          /* this.calendar_entries = entries as calendar; fare la conversione con i tipi presenti sul client*/
          let calendar_entries: calendar = {
            day_works: [],
            requests: [],
            working_trips: [],
            availabilities: [],
          };
          this.emptyEntries();
          for (let api_entry of entries) {
            switch (api_entry.entryType) {
              case 'WORKING_TRIP': {
                /* const client_working_trip: working_trip = {
                  from: api_entry.entry.from, //Controlla meglio come vengono indicate le date sul client
                  to: api_entry.entry.to
                } */
                api_entry.entry.from = this.dateFormatter.formatDateString(
                  api_entry.entry.from
                );
                api_entry.entry.to = this.dateFormatter.formatDateString(
                  api_entry.entry.to
                );
                calendar_entries.working_trips.push(api_entry.entry);
                break;
              }
              case 'AVAILABILITY': {
                /* const client_availability: availability = {
                  from: api_entry.entry.from,
                  to: api_entry.entry.to,
                  project: api_entry.entry.project
                }; */
                api_entry.entry.from = this.dateFormatter.formatDateString(
                  api_entry.entry.from
                );
                api_entry.entry.to = this.dateFormatter.formatDateString(
                  api_entry.entry.to
                );
                calendar_entries.availabilities.push(api_entry.entry);
                break;
              }
              case 'REQUEST': {
                /* const client_request: request = {
                  request_type: api_entry.entry.request_type,

                } */
                api_entry.entry.date_from = this.dateFormatter.formatDateString(
                  api_entry.entry.date_from
                );
                api_entry.entry.date_to = this.dateFormatter.formatDateString(
                  api_entry.entry.date_to
                );
                calendar_entries.requests.push(api_entry.entry);
                break;
              }
              case 'WORKING_DAY': {
                api_entry.entry.date_from = this.dateFormatter.formatDateString(
                  api_entry.entry.date_from
                );
                calendar_entries.day_works.push(api_entry.entry);
                break;
              }
              default: {
                console.error(
                  'Calendar type from api not matching entry type',
                  api_entry.entryType,
                  'sdfsdf',
                  'WORKING TRIP'
                );
                break;
              }
            }
            console.log('CALENDARIO', entries);
            resolve(calendar_entries);
          }
        },
        (err) => {
          console.error('Errore nel reperimento dei dati del calendario:', err);
          reject();
        }
      );
    });
    /* if(this.authService.token == null)
      throw Error("Nessun token di autorizzazione per reperimento calendario");
    this.apiService.retrieveCalendarEntries(this.authService.token).subscribe(
      resp => {
        this
      },
      err => {
        console.error("Errore nel reperimento dei dati del calendario!");
      }
    ) */
  }

  get day_work_entries() {
    return this.calendar_entries.day_works;
  }
  get day_work_entries_back() {
    return this.calendar_entries.day_works;
  }
  set setDay_work_entries(new_day_work: any) {
    this.calendar_entries.day_works = new_day_work;
  }

  get request_entries() {
    return this.calendar_entries.requests;
  }
  set setRequest_entries(new_request: any) {
    this.calendar_entries.requests = new_request;
  }

  get working_trip_entries() {
    return new Promise<working_trip[]>((resolve, reject) => {
      this.retrieveCalendarEntries2()
        .then((value) => {
          resolve(this.calendar_entries.working_trips);
        })
        .catch((err) => {
          reject([]);
        });
    });
  }
  set setWorking_trip_entries(new_wtrip: any) {
    this.calendar_entries.working_trips = new_wtrip;
  }

  get availability_entries() {
    return this.calendar_entries.availabilities;
  }
  set setAvailability_entries(new_availability: any) {
    this.calendar_entries.availabilities = new_availability;
  }

  emptyEntries() {
    this.calendar_entries = {
      day_works: [],
      requests: [],
      working_trips: [],
      availabilities: [],
    };
  }

  addWorkingTrip(new_working_trip: working_trip): void {
    this.calendar_entries.working_trips.push(new_working_trip);
  }

  addAvailability(new_availability: availability): void {
    this.calendar_entries.availabilities.push(new_availability);
  }

  addRequest(new_request: request) {
    this.calendar_entries.requests.push(new_request);
  }

  addDayWork(new_day_work: day_work) {
    this.calendar_entries.day_works.push(new_day_work);
  }

  /* modifyEntry(old_entry: any, new_entry: any){
    this.apiService.modifyCalendarEntry()
  } */

  modifyEntries(
    to_modify_entries: { old_entry: any; new_entry: any }[],
    entries_type: entryType
  ) {
    this.modifyCalendarEntries(to_modify_entries, entries_type)?.subscribe(
      (value) => console.log('value', value),
      (err) => console.error('error', err)
    );
  }

  getAllCalendarEntries() {
    if (!this.authService.token) {
      console.error(
        'Nessun token di autorizzazione per reperimento calendario'
      );
      return;
    }
    const headers: HttpHeaders = new HttpHeaders({
      Authorization: 'Bearer ' + this.authService.token,
    });
    return this.http.get<apiEntry[]>(this.API_URL + '/calendar/retrieveAll', {
      headers: headers,
    });
  }

  modifyCalendarEntries(
    to_modify_entries: { old_entry: any; new_entry: any }[],
    entries_type: entryType
  ) {
    if (!this.authService.token) {
      console.error('Nessun token di autorizzazione per modifica calendario');
      return;
    }
    const headers: HttpHeaders = new HttpHeaders({
      Authorization: 'Bearer ' + this.authService.token,
    });
    console.log('Mando la richiesta di modifica', this.authService.token);
    return this.http.put<apiEntry[]>(this.API_URL + '/calendar/modifyEntries', {
      headers: headers,
    });
  }
}
