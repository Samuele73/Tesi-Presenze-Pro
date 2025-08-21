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
  CalendarRequestEntry,
  CalendarResponseDto,
  CalendarService,
  CalendarWorkingDayEntry,
  CalendarWorkingTripEntry,
} from 'src/generated-client';
import { en } from '@fullcalendar/core/internal-common';

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
          newCalendarData.day_works.push(
            dto.calendarEntry as CalendarWorkingDayEntry
          );
          break;
        }
        case CalendarResponseDto.EntryTypeEnum.REQUEST: {
          newCalendarData.requests.push(
            dto.calendarEntry as CalendarRequestEntry
          );
          break;
        }
        case CalendarResponseDto.EntryTypeEnum.WORKINGTRIP: {
          newCalendarData.working_trips.push(
            dto.calendarEntry as CalendarWorkingTripEntry
          );
          break;
        }
        case CalendarResponseDto.EntryTypeEnum.AVAILABILITY: {
          newCalendarData.availabilities.push(
            dto.calendarEntry as CalendarAvailabilityEntry
          );
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

  loadCalendarByMonthYear(month: string, year: string): void {
    this.calendarApi.getCalendarEntitiesByMonthYear(month, year).subscribe({
      next: (calendarData: CalendarResponseDto[]) => {
        console.log("GUARDAAA", calendarData);
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
}
