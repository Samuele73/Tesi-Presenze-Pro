import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { environment } from 'src/environments/environment';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import {
  CalendarAvailabilityEntry,
  CalendarEntity,
  CalendarEntry,
  CalendarRequestEntry,
  CalendarResponseDto,
  CalendarService,
  CalendarWorkingDayEntry,
  CalendarWorkingTripEntry,
  SaveCalendarEntityRequestDto,
} from 'src/generated-client';
import { en } from '@fullcalendar/core/internal-common';
import { id } from 'date-fns/locale';
import { calendar, identifiableCalendarEntry } from '../models/calendar';
import { ToastrService } from 'ngx-toastr';

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

  constructor(private calendarApi: CalendarService, private toastrSerice: ToastrService) {}

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
          };
          newCalendarData.day_works.push(finalEntry);
          break;
        }
        case CalendarResponseDto.EntryTypeEnum.REQUEST: {
          const finalEntry = {
            id: dto.id!,
            calendarEntry: dto.calendarEntry as CalendarRequestEntry,
          };
          newCalendarData.requests.push(finalEntry);
          break;
        }
        case CalendarResponseDto.EntryTypeEnum.WORKINGTRIP: {
          const finalEntry = {
            id: dto.id!,
            calendarEntry: dto.calendarEntry as CalendarWorkingTripEntry,
          };
          newCalendarData.working_trips.push(finalEntry);
          break;
        }
        case CalendarResponseDto.EntryTypeEnum.AVAILABILITY: {
          const finalEntry = {
            id: dto.id!,
            calendarEntry: dto.calendarEntry as CalendarAvailabilityEntry,
          };
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

  getCalendarByMonthYear(month: string, year: string): Observable<boolean> {
    return this.calendarApi.getCalendarEntitiesByMonthYear(month, year).pipe(
      tap((calendarData: CalendarResponseDto[]) => {
        console.log('GUARDAAA', calendarData);
        const newCalendarData =
          this.fromCalendarResponseDtoToCalendar(calendarData);
        this.calendar$.next(newCalendarData);
        // Opzionale: resetta l'errore se la chiamata ha successo
        // this.error$.next(null);
      }),
      map(() => true),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetch calendar:', error);
        this.error$.next(error.error.message || "Errore nel recupero del calendario");
        this.toastrSerice.error(error.error.message);
        return of(false);
      })
    );
  }

  saveCalendarEntry(
    calendarEntry: CalendarEntry,
    entryType: CalendarEntity.EntryTypeEnum
  ): Observable<boolean> {
    console.log('Sto salvandoooooo');
    const saveCalendarEntityRequest: SaveCalendarEntityRequestDto = {
      entryType: entryType,
      calendarEntry: calendarEntry,
    };

    return this.calendarApi.saveCalendarEntity(saveCalendarEntityRequest).pipe(
      tap((response: CalendarResponseDto) => {
        console.log('Calendar entry saved successfully:', response);

        // Ottieni il calendario corrente
        const currentCalendar = this.calendar$.getValue();

        // Converti la response in un oggetto calendar (ma è una lista, quindi ti ritorna 1 solo entry mappata)
        const newCalendarData = this.fromCalendarResponseDtoToCalendar([
          response,
        ]);

        // Crea una copia immutabile unendo il nuovo dato allo stato attuale
        const updatedCalendar: calendar = {
          ...currentCalendar,
          day_works: [
            ...currentCalendar.day_works,
            ...newCalendarData.day_works,
          ],
          requests: [...currentCalendar.requests, ...newCalendarData.requests],
          working_trips: [
            ...currentCalendar.working_trips,
            ...newCalendarData.working_trips,
          ],
          availabilities: [
            ...currentCalendar.availabilities,
            ...newCalendarData.availabilities,
          ],
        };

        // Aggiorna lo stato
        this.calendar$.next(updatedCalendar);
      }),
      map(() => true),
      catchError((error: HttpErrorResponse) => {
        console.error('Error saving calendar entry:', error);
        this.error$.next(error.error.message || "Errore nel salvataggio dell'entry del calendario");
        this.toastrSerice.error(error.error.message);
        return of(false);
      })
    );
  }

  saveCalendarEntities(
    calendarEntry: CalendarEntry[],
    entryType: CalendarEntity.EntryTypeEnum
  ): Observable<boolean> {
    const saveCalendarEntityRequest: SaveCalendarEntityRequestDto[] =
      calendarEntry.map((entry) => ({
        entryType: entryType,
        calendarEntry: entry,
      }));

    return this.calendarApi
      .saveMultipleCalendarEntities(saveCalendarEntityRequest)
      .pipe(
        tap((response: CalendarResponseDto[]) => {
          console.log('Calendar entry saved successfully:', response);

          // Ottieni il calendario corrente
          const currentCalendar = this.calendar$.getValue();

          // Converti la response in un oggetto calendar
          const newCalendarData: calendar =
            this.fromCalendarResponseDtoToCalendar(response);

          // Crea una copia immutabile unendo il nuovo dato allo stato attuale
          const updatedCalendar: calendar = {
            ...currentCalendar,
            day_works: [
              ...currentCalendar.day_works,
              ...newCalendarData.day_works,
            ],
            requests: [
              ...currentCalendar.requests,
              ...newCalendarData.requests,
            ],
            working_trips: [
              ...currentCalendar.working_trips,
              ...newCalendarData.working_trips,
            ],
            availabilities: [
              ...currentCalendar.availabilities,
              ...newCalendarData.availabilities,
            ],
          };

          // Aggiorna lo stato
          this.calendar$.next(updatedCalendar);
        }),
        map(() => true),
        catchError((error: HttpErrorResponse) => {
          console.error('Error saving calendar entry:', error);
          this.error$.next(error.error.message || "Errore nel salvataggio dell'entry del calendario");
          this.toastrSerice.error(error.error.message);
          return of(false);
        })
      );
  }

  deleteCalendarEntities(
    entryIds: string[],
    entryType: CalendarEntity.EntryTypeEnum
  ): Observable<boolean> {
    return this.calendarApi.deleteMultipleCalendarEntities(entryIds).pipe(
      tap(() => {
        console.log('Calendar entries deleted successfully');

        // Ottieni il calendario corrente
        const currentCalendar = this.calendar$.getValue();

        // Crea una copia immutabile rimuovendo le entry cancellate dallo stato attuale
        let updatedCalendar: calendar = { ...currentCalendar };

        switch (entryType) {
          case CalendarEntity.EntryTypeEnum.WORKINGDAY:
            updatedCalendar.day_works = currentCalendar.day_works.filter(
              (entry) => !entryIds.includes(entry.id)
            );
            break;
          case CalendarEntity.EntryTypeEnum.REQUEST:
            updatedCalendar.requests = currentCalendar.requests.filter(
              (entry) => !entryIds.includes(entry.id)
            );
            break;
          case CalendarEntity.EntryTypeEnum.WORKINGTRIP:
            updatedCalendar.working_trips =
              currentCalendar.working_trips.filter(
                (entry) => !entryIds.includes(entry.id)
              );
            break;
          case CalendarEntity.EntryTypeEnum.AVAILABILITY:
            updatedCalendar.availabilities =
              currentCalendar.availabilities.filter(
                (entry) => !entryIds.includes(entry.id)
              );
            break;
          default:
            console.warn(
              `Unknown calendar entry type for deletion: ${entryType}`
            );
        }

        // Aggiorna lo stato
        this.calendar$.next(updatedCalendar);
      }),
      map(() => true),
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting calendar entries:', error);
        this.error$.next(
          error.error.message || "Errore nella cancellazione dell'entry del calendario"
        );
        this.toastrSerice.error(error.error.message);
        return of(false);
      })
    );
  }

  updateCalendarEntries(
    entries: identifiableCalendarEntry[],
    entryType: CalendarEntity.EntryTypeEnum
  ): Observable<boolean> {
    console.log('sto updatting', entries);
    const updateCalendarEntities: CalendarEntity[] = entries.map(
      (entry: identifiableCalendarEntry) => ({
        id: entry.id,
        userEmail: '', // TO DO: create a dto to remove this field (it is not used)
        entryType: entryType,
        calendarEntry: entry.calendarEntry,
      })
    );
    console.log('updateCalendarEntities', updateCalendarEntities);

    return this.calendarApi.updateCalendarEntities(updateCalendarEntities).pipe(
      tap((response: CalendarResponseDto[]) => {
        console.log('Calendar entries updated successfully:', response);

        // Ottieni il calendario corrente
        const currentCalendar = this.calendar$.getValue();

        // Converti la response in un oggetto calendar
        const newCalendarData: calendar =
          this.fromCalendarResponseDtoToCalendar(response);

        // Crea una copia immutabile aggiornando le entry modificate nello stato attuale
        let updatedCalendar: calendar = { ...currentCalendar };

        switch (entryType) {
          case CalendarEntity.EntryTypeEnum.WORKINGDAY:
            updatedCalendar.day_works = currentCalendar.day_works.map(
              (entry) => {
                const updatedEntry = newCalendarData.day_works.find(
                  (e) => e.id === entry.id
                );
                return updatedEntry ? updatedEntry : entry;
              }
            );
            break;
          case CalendarEntity.EntryTypeEnum.REQUEST:
            updatedCalendar.requests = currentCalendar.requests.map((entry) => {
              const updatedEntry = newCalendarData.requests.find(
                (e) => e.id === entry.id
              );
              return updatedEntry ? updatedEntry : entry;
            });
            break;
          case CalendarEntity.EntryTypeEnum.WORKINGTRIP:
            updatedCalendar.working_trips = currentCalendar.working_trips.map(
              (entry) => {
                const updatedEntry = newCalendarData.working_trips.find(
                  (e) => e.id === entry.id
                );
                return updatedEntry ? updatedEntry : entry;
              }
            );
            break;
          case CalendarEntity.EntryTypeEnum.AVAILABILITY:
            updatedCalendar.availabilities = currentCalendar.availabilities.map(
              (entry) => {
                const updatedEntry = newCalendarData.availabilities.find(
                  (e) => e.id === entry.id
                );
                return updatedEntry ? updatedEntry : entry;
              }
            );
            break;
          default:
            console.warn(
              `Unknown calendar entry type for update: ${entryType}`
            );
        }

        // Aggiorna lo stato
        this.calendar$.next(updatedCalendar);
      }),
      map(() => true),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating calendar entries:', error);
        this.error$.next(error.error.message || "Errore nell'aggiornamento dell'entry del calendario");
        this.toastrSerice.error(error.error.message);
        return of(false);
      })
    );
  }
}
