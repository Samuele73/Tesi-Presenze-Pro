import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
import { BehaviorSubject, Observable } from 'rxjs';
import {
  CalendarAvailabilityEntry,
  CalendarEntity,
  CalendarEntry,
  CalendarRequestEntry,
  CalendarResponseDto,
  CalendarService,
  CalendarWorkingDayEntry,
  CalendarWorkingTripEntry,
} from 'src/generated-client';
import { en } from '@fullcalendar/core/internal-common';
import { id } from 'date-fns/locale';

@Injectable({
  providedIn: 'root',
})
export class CalendarStateService {
  private calendar$: BehaviorSubject<calendar> = new BehaviorSubject<calendar>(
    {} as calendar
  );
  private error$: BehaviorSubject<string | null> = new BehaviorSubject<
    string | null
  >(null);

  constructor(private calendarApi: CalendarService) {}

  get calendar(): Observable<calendar> {
    return this.calendar$.asObservable();
  }
  get error(): Observable<string | null> {
    return this.error$.asObservable();
  }

  private fromCalendarResponseDtoToCalendar(
    calendarResponseDto: CalendarResponseDto[]
  ): calendar {
    let newCalendarData: calendar = {
      day_works: [],
      requests: [],
      working_trips: [],
      availabilities: [],
      // aggiungi altre proprietà se necessarie
    } as calendar;

    calendarResponseDto.forEach((dto: CalendarResponseDto) => {
      switch (dto.entryType) {
        case CalendarResponseDto.EntryTypeEnum.WORKINGDAY: {
          const finalEntry = {
              id: dto.id!,
              calendarEntry: dto.calendarEntry as CalendarWorkingDayEntry,
            }
          newCalendarData.day_works.push(finalEntry);
          break;
        }
        case CalendarResponseDto.EntryTypeEnum.REQUEST: {
          const finalEntry = {
            id: dto.id!,
            calendarEntry: dto.calendarEntry as CalendarRequestEntry,
          }
          newCalendarData.requests.push(finalEntry);
          break;
        }
        case CalendarResponseDto.EntryTypeEnum.WORKINGTRIP: {
          const finalEntry = {
            id: dto.id!,
            calendarEntry: dto.calendarEntry as CalendarWorkingTripEntry,
          }
          newCalendarData.working_trips.push(finalEntry);
          break;
        }
        case CalendarResponseDto.EntryTypeEnum.AVAILABILITY: {
          const finalEntry = {
            id: dto.id!,
            calendarEntry: dto.calendarEntry as CalendarAvailabilityEntry,
          }
          newCalendarData.availabilities.push(finalEntry);
          break;
        }
        default: {
          console.warn(
            `Unknown calendar entry type fetched from api: ${dto.entryType}`
          );
        }
      }
    });
    return newCalendarData;
  }

  getCalendarByMonthYear(month: string, year: string): void {
    this.calendarApi.getCalendarEntitiesByMonthYear(month, year).subscribe({
      next: (calendarData: CalendarResponseDto[]) => {
        console.log('GUARDAAA', calendarData);
        const newCalendarData: calendar =
          this.fromCalendarResponseDtoToCalendar(calendarData);
        this.calendar$.next(newCalendarData);
      },
      error: (error) => {
        console.error('Error fetch calendar:', error);
        this.error$.next('Errore nella raccolta dati del calendario');
      },
    });
  }

  saveCalendarEntry(calendarEntry: CalendarEntry, entryType: CalendarEntity.EntryTypeEnum){
    /* const newCalendarEntity: CalendarEntity = {}
    this.calendarApi.saveCalendarEntity(calendarEntry, entryType).subscribe({
      next: (response) => {
        console.log('Calendar entry saved successfully:', response);
        // Optionally, you can refresh the calendar data after saving
        this.getCalendarByMonthYear(
          new Date().getMonth().toString(),
          new Date().getFullYear().toString()
        );
      },
      error: (error) => {
        console.error('Error saving calendar entry:', error);
        this.error$.next('Errore nel salvataggio dell\'entry del calendario');
      },
    }); */
  }
}
