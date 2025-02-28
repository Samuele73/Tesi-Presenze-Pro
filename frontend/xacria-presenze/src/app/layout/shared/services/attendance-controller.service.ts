import { Injectable } from '@angular/core';
import { ApiService } from 'src/app/shared/services/api.service';
import { AuthService } from 'src/app/shared/services/auth.service';

@Injectable({
  providedIn: 'root'
})

export class AttendanceControllerService {
  calendar_entries!: calendar; //Forse meglio calendar[] | [] per mettere mesi su localStorage.

  constructor(private authService: AuthService, private apiService: ApiService) {
    /* const userEmail = this.authService.getUserEmail();
    if(userEmail)
      userEmail.subscribe() */
    this.retrieveCalendarEntries2().then(
      (value: any) =>{
        console.log("CALENDARIO VALORE PROMISE", value);
      }
    ).catch((err) => {
      console.error("VALORE CALENDARIO PROMISE ERRORE",  err);
    })
    this.emptyEntries(); //togliere non appena si implementa tutto tramite api
  }

  retrieveCalendarEntries(): boolean{
    return false; //Togliere se si vuole fare funzionare il localStorage (ci sono problemi di duplicazione degli inseriemnti nella app-modal nel caso di aggiornamento della pagina)
    const wtrip_entries: any = localStorage.getItem("wtrip_entries");
    const request_entries: any = localStorage.getItem("request_entries");
    const day_work_entries: any = localStorage.getItem("day_work_entries");
    if(!wtrip_entries && !request_entries && !day_work_entries){
      console.log("non vi sono calendar entries per il mese");
      return false;
    }
    this.calendar_entries.working_trips = JSON.parse(wtrip_entries);
    this.calendar_entries.day_works = JSON.parse(day_work_entries);
    this.calendar_entries.requests = JSON.parse(request_entries);
    return true;
  }

  retrieveCalendarEntries2(){
    return new Promise<void>((resolve, reject) => {
      if(this.authService.token == null)
        reject();
      this.apiService.retrieveCalendarEntries(this.authService.token!).subscribe(
        (entries: apiEntry[]) => {
          /* this.calendar_entries = entries as calendar; fare la conversione con i tipi presenti sul client*/
          this.emptyEntries();
          for(let api_entry of entries){
            switch(api_entry.entryType){
              case 'WORKING_TRIP':{
                /* const client_working_trip: working_trip = {
                  from: api_entry.entry.from, //Controlla meglio come vengono indicate le date sul client
                  to: api_entry.entry.to
                } */
                api_entry.entry.from = api_entry.entry.from.split("T")[0];
                api_entry.entry.to = api_entry.entry.to.split("T")[0];
                this.calendar_entries.working_trips.push(api_entry.entry);
                break;
              }
              case "AVAILABILITY":{
                /* const client_availability: availability = {
                  from: api_entry.entry.from,
                  to: api_entry.entry.to,
                  project: api_entry.entry.project
                }; */
                api_entry.entry.from = api_entry.entry.from.split("T")[0];
                api_entry.entry.to = api_entry.entry.to.split("T")[0];
                this.calendar_entries.availabilities.push(api_entry.entry);
                break;
              }
              case "REQUEST":{
                /* const client_request: request = {
                  request_type: api_entry.entry.request_type,

                } */
                api_entry.entry.date_from = api_entry.entry.date_from.split("T")[0];
                api_entry.entry.date_to = api_entry.entry.date_to.split("T")[0];
                this.calendar_entries.requests.push(api_entry.entry);
                break;
              }
              case "WORKING_DAY":{
                api_entry.entry.date_from = api_entry.entry.date_from.split("T")[0];
                this.calendar_entries.day_works.push(api_entry.entry);
                break;
              }
              default: {
                console.error("Calendar type from api not matching entry type", api_entry.entryType, "sdfsdf", "WORKING TRIP");
                break;
              }
            }
            console.log("CALENDARIO", entries);
            resolve();
          }
        },
        err => {
          console.error("Errore nel reperimento dei dati del calendario:", err);
          reject();
        }
      )
    })
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

  get day_work_entries(){return this.calendar_entries.day_works;}
  get day_work_entries_back(){

    return this.calendar_entries.day_works;
  }
  set setDay_work_entries(new_day_work: any){this.calendar_entries.day_works = new_day_work;}

  get request_entries(){return this.calendar_entries.requests;}
  set setRequest_entries(new_request: any){this.calendar_entries.requests = new_request;}

  get working_trip_entries(){
    return new Promise<working_trip[]>((resolve, reject) => {
      this.retrieveCalendarEntries2().then(
        value => {
          resolve(this.calendar_entries.working_trips);
        }
      ).catch(
        err => {
          reject([]);
        }
      )
    })
  }
  set setWorking_trip_entries(new_wtrip: any){this.calendar_entries.working_trips = new_wtrip;}

  get availability_entries(){return this.calendar_entries.availabilities;}
  set setAvailability_entries(new_availability: any){this.calendar_entries.availabilities = new_availability;}

  emptyEntries(){
    this.calendar_entries = {
      day_works: [],
      requests: [],
      working_trips: [],
      availabilities: []
    };
  }

  addWorkingTrip(new_working_trip: working_trip): void{
    this.calendar_entries.working_trips.push(new_working_trip);
  }

  addAvailability(new_availability: availability): void{
    this.calendar_entries.availabilities.push(new_availability);
  }

  addRequest(new_request: request){
    this.calendar_entries.requests.push(new_request);
  }

  addDayWork(new_day_work: day_work){
    this.calendar_entries.day_works.push(new_day_work);
  }

  /* modifyEntry(old_entry: any, new_entry: any){
    this.apiService.modifyCalendarEntry()
  } */

  modifyEntries(to_modify_entries: {old_entry: any, new_entry: any}[], entries_type: entryType){
    this.apiService.modifyCalendarEntries(to_modify_entries, entries_type, this.authService.token!).subscribe(
      value => console.log("value", value),
      err => console.error("error", err)
    );
  }
}

interface day_work{
  project: string,
  hour_from: string,
  hour_to: string,
  date_from?: object
}

interface request{
  request_type: string,
  date_from: string,
  date_to: string,
  time_from: string,
  time_to: string
}

export interface working_trip{
  from: string,
  to: string
}

interface availability{
  from: string,
  to: string,
  project: string
}

export interface calendar{
  day_works: day_work[],
  requests: request[],
  working_trips: working_trip[],
  availabilities: availability[]
}

export interface apiEntry{
  entryType: entryType,
  entry: any //IMPORTANTE: Creare tutti i tipi del server. poi ricorda di spostare tutte quest interfacce su un models apposito e non lasciarlo in questo file
}



export type entryType = "WORKING_TRIP" | "WORKING_DAY" | "REQUEST" | "AVAILABILITY"

