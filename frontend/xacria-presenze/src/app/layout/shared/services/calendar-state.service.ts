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
import { CalendarService } from 'src/generated-client';

@Injectable({
  providedIn: 'root',
})
export class CalendarStateService {
  private calendar$: BehaviorSubject<calendar> = new BehaviorSubject<calendar>(
    {} as calendar
  );
  private error$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private calendarApi: CalendarService) {}

  get calendar(): Observable<calendar> {
    return this.calendar$.asObservable();
  }
  get error(): Observable<string | null> {
    return this.error$.asObservable();
  }

  loadCalendarByMonthYear(month: string, year: string): void {
    this.calendarApi.getCalendarEntitiesByMonthYear(month, year).subscribe({
      next: (calendarData) => {
        this.calendar$.next(calendarData);
      },
      error: (error) => {
        console.error('Error loading calendar:', error);
      },
    });
  }
}
