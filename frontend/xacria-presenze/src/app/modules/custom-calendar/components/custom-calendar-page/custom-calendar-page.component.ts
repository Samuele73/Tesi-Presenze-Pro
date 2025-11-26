import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  TemplateRef,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { NgbAlert, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  Calendar,
  CalendarOptions,
  DayCellContentArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Renderer2, ElementRef } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import {
  faPlus,
  faCalendarMinus,
  faBriefcase,
  faX,
  faCoffee,
  faMinus,
  faRoute,
  faPenToSquare,
  faBell,
  faArrowRight,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { CalendarView } from 'angular-calendar';
import { WorkingTripModalComponent } from '../modals/working-trip-modal/working-trip-modal.component';
import { ModalComponent } from '../modals/modalComponent';
import { AvailabilityModalComponent } from '../modals/availability-modal/availability-modal.component';
import { RequestModalComponent } from '../modals/request-modal/request-modal.component';
import { DayworkModalComponent } from '../modals/daywork-modal/daywork-modal.component';
import { CalendarAvailabilityEntry, CalendarEntity, CalendarEntry, UserData, UserService } from 'src/generated-client';
import { Subject, takeUntil } from 'rxjs';
import { calendar, identifiableCalendarWorkingDay } from '../../models/calendar';
import { CalendarStateService } from '../../services/calendar-state.service';
import { monthNamesIt, weekDayNamesIt } from '../../const-vars';
import { ToastrService } from 'ngx-toastr';
import { ProjectStoreService } from 'src/app/modules/project/services/project-store.service';
import { DateFormatService } from 'src/app/shared/services/date-format.service';

type DistributedModalComponent = AvailabilityModalComponent | RequestModalComponent | WorkingTripModalComponent;
type ModalComponentType = DistributedModalComponent | DayworkModalComponent;

declare var bootstrap: any;

@Component({
  selector: 'app-attendance',
  changeDetection: ChangeDetectionStrategy.OnPush, // Abilitato OnPush
  styleUrls: ['./custom-calendar-page.component.scss'],
  templateUrl: './custom-calendar-page.component.html',
})
export class CustomCalendarPageComponent implements OnInit, AfterViewInit, OnDestroy {
  // Subject per gestire l'unsubscribe
  private destroy$ = new Subject<void>();

  viewDate: Date = new Date();
  events = [];
  view: CalendarView = CalendarView.Month;

  @ViewChild('working_trip_modal') workingTripModal!: WorkingTripModalComponent;
  @ViewChild('availability_modal') availabilityModal!: AvailabilityModalComponent;
  @ViewChild('request_modal') requestModal!: RequestModalComponent;
  @ViewChild('daywork_modal') dayworkModal!: DayworkModalComponent;

  dayClicked: Date = new Date();
  faIcons: any = faIcons;
  weekDayNames!: string[];
  monthNames!: string[];
  CalendarEntryType = CalendarEntity.EntryTypeEnum;

  // Valori pre-calcolati per evitare chiamate di funzione nei template
  dayWorkDateTitle: string = '';
  currentMonthYear: string = '';
  currentMonth: string = '';
  currentYear: string = '';
  hoursWorked: string = 'Ore lavorate: 0';

  // Cache per i calcoli costosi
  private dateToTitleCache = new Map<string, string>();

  // Oggetti pre-estratti per evitare accesso a proprietà nei template
  dayWorksEntries: any[] = [];
  requestsEntries: any[] = [];
  workingTripsEntries: any[] = [];
  availabilitiesEntries: any[] = [];

  calendarEntries: calendar = {
    day_works: [],
    requests: [],
    working_trips: [],
    availabilities: []
  } as calendar;

  errorMessage: string | null = null;

  constructor(
    private calendarStateService: CalendarStateService,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private toastrService: ToastrService,
    private projectStoreService: ProjectStoreService,
    public dateFormat: DateFormatService
  ) {
    this.weekDayNames = weekDayNamesIt;
    this.monthNames = monthNamesIt;
    this.updatePreCalculatedValues();
  }

  private subscriteToCalendarStateServices(): void {
    this.calendarStateService.calendar
      .pipe(takeUntil(this.destroy$))
      .subscribe((calendar: calendar) => {
        this.calendarEntries = calendar;
        this.updateEntriesReferences();
        this.hoursWorked = `Ore lavorate: ${this.calculateHoursWorked(this.viewDate)}`;
        console.log('CALENDAR SUBSCRIPTION, calendar on client', this.calendarEntries, "calendar from server", calendar);
        this.cdr.markForCheck();
      });

    this.calendarStateService.error
      .pipe(takeUntil(this.destroy$))
      .subscribe((error: string | null) => {
        this.errorMessage = error;
        /* if(this.errorMessage)
          this.toastrService.error(this.errorMessage); */
        this.cdr.markForCheck();
      });
  }

  // Aggiorna i riferimenti agli array per evitare accesso a proprietà nei template
  private updateEntriesReferences(): void {
    this.dayWorksEntries = this.calendarEntries.day_works || [];
    this.requestsEntries = this.calendarEntries.requests || [];
    this.workingTripsEntries = this.calendarEntries.working_trips || [];
    this.availabilitiesEntries = this.calendarEntries.availabilities || [];
  }

  // Pre-calcola i valori che vengono utilizzati nei template
  private updatePreCalculatedValues(): void {
    this.currentMonth = (this.viewDate.getMonth() + 1).toString();
    this.currentYear = this.viewDate.getFullYear().toString();
    this.currentMonthYear = `${this.monthNames[this.viewDate.getMonth()]} ${this.currentYear}`;
    this.dayWorkDateTitle = this.fromDateToModalTitle(this.dayClicked);
  }

  ngOnInit(): void {
    this.projectStoreService.getUserProjectsNames().subscribe((success: boolean) => {
      if (!success) {
        this.toastrService.error("Errore nel caricamento dei progetti utente.");
      }
    });
    this.subscriteToCalendarStateServices();
    this.calendarStateService.getCalendarByMonthYear(
      this.currentMonth,
      this.currentYear
    ).subscribe((resp: boolean) => {
      if(!resp)
        this.toastrService.error("Errore nel caricamento del calendario.");
    });
  }


  ngAfterViewInit(): void {
    this.initializeBootstrapTooltips();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dateToTitleCache.clear();
  }

  initializeBootstrapTooltips(): void {
    // Usa requestAnimationFrame per evitare problemi di performance
    requestAnimationFrame(() => {
      const tooltipTriggerList = document.querySelectorAll('.tt');
      tooltipTriggerList.forEach((el) => new bootstrap.Tooltip(el, {
        container: 'body',
        customClass: 'custom-tooltip'
      }));
    });
  }

  private changeMonth(shift: number): Date {
    const newDate = new Date(this.viewDate);
    newDate.setMonth(newDate.getMonth() + shift);
    return newDate;
  }

  previous(): void {
    this.viewDate = this.changeMonth(-1);
    this.updatePreCalculatedValues();
    this.calendarStateService.getCalendarByMonthYear(
      this.currentMonth,
      this.currentYear
    ).subscribe((resp: boolean) => {
      if(!resp)
        this.toastrService.error("Errore nel caricamento del calendario.");
    });
    this.cdr.markForCheck();
  }

  next(): void {
    this.viewDate = this.changeMonth(+1);
    this.updatePreCalculatedValues();
    this.calendarStateService.getCalendarByMonthYear(
      this.currentMonth,
      this.currentYear
    ).subscribe((resp: boolean) => {
      if(!resp)
        this.toastrService.error("Errore nel caricamento del calendario.");
    });
    this.cdr.markForCheck();
  }

  openAddModal(modal: ModalComponentType, date?: Date): void {
    if (date && !(modal instanceof DayworkModalComponent)) {
      console.log("date:", date);
      modal.currentDate = date;
      console.log("modal date:", modal.currentDate);
    }
    modal.open();
  }

  setDateForModals(dayEvent: any): void {
    console.log('PROVA', dayEvent);
    this.dayClicked = dayEvent.day.date;
    this.dayWorkDateTitle = this.fromDateToModalTitle(this.dayClicked);
    console.log('CONTROLLA IL DAYCLICKED', this.dayClicked);
    this.cdr.markForCheck();
  }

  fromDateToModalTitle(date: Date): string {
    if (!date) return '';

    const key = date.toDateString();
    if (this.dateToTitleCache.has(key)) {
      return this.dateToTitleCache.get(key) as string;
    }

    const month: string = monthNamesIt[date.getMonth()];
    const day: string = date.getDate().toString();
    const year: string = date.getFullYear().toString();
    const dayWord: string = this.weekDayNames[date.getDay()];
    const result: string = `${day} ${month} ${year} - ${dayWord}`;

    // Limita la cache a 50 elementi per evitare memory leaks
    if (this.dateToTitleCache.size > 50) {
      const firstKey: string | undefined = this.dateToTitleCache.keys().next().value;
      if (firstKey) {
        this.dateToTitleCache.delete(firstKey);
      }
    }

    this.dateToTitleCache.set(key, result);
    return result;
  }

  trackByDate(index: number, item: any): any {
    return item?.date?.getTime() || index;
  }

  trackByDateFrom(index: number, item: any): any {
    return item?.date_from?.getTime() || index;
  }

  calculateHoursWorked(date: Date): number {
  if (!date || !this.calendarEntries.day_works) return 0;

  const totalHours = this.calendarEntries.day_works
    .filter((entry: identifiableCalendarWorkingDay) => {
      const entryDate = new Date(entry.calendarEntry.dateFrom || '');
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    })
    .reduce((sum, entry) => {
      const from = entry.calendarEntry.hourFrom;
      const to = entry.calendarEntry.hourTo;

      if (!from || !to) return sum;

      const [fh, fm] = from.split(':').map(Number);
      const [th, tm] = to.split(':').map(Number);

      const fromMinutes = fh * 60 + fm;
      const toMinutes = th * 60 + tm;

      const diffHours = (toMinutes - fromMinutes) / 60;

      return sum + (diffHours > 0 ? diffHours : 0);
    }, 0);

  return Math.floor(totalHours);
}
}

export const faIcons = {
  plus: faPlus,
  minus: faMinus,
  briefcase: faBriefcase,
  calendar: faCalendarMinus,
  xSymbol: faX,
  route: faRoute,
  request: faPenToSquare,
  bell: faBell,
  arrowRight: faArrowRight,
  arrowLeft: faArrowLeft,
};
