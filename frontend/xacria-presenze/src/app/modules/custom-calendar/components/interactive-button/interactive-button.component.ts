import {
  AfterViewInit,
  Component,
  Input,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import {
  faPlus,
  faMinus,
  faBriefcase,
  faCalendarMinus,
  faX,
  faRoute,
  faPenToSquare,
  faBell,
  faArrowRight,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { AvailabilityModalComponent } from '../modals/availability-modal/availability-modal.component';
import { RequestModalComponent } from '../modals/request-modal/request-modal.component';
import { WorkingTripModalComponent } from '../modals/working-trip-modal/working-trip-modal.component';
import { DayworkModalComponent } from '../modals/daywork-modal/daywork-modal.component';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import {
  CalendarAvailabilityEntry,
  CalendarRequestEntry,
  CalendarWorkingDayEntry,
  CalendarWorkingTripEntry,
} from 'src/generated-client';
import { calendar, identifiableCalendarAvailability, identifiableCalendarEntry, identifiableCalendarRequest, identifiableCalendarWorkingDay, identifiableCalendarWorkingTrip } from '../../models/calendar';

declare var bootstrap: any;
const faIcons = {
  plus: faPlus,
  minus: faMinus,
  briefcase: faBriefcase,
  calendar: faCalendarMinus,
  xSimbol: faX,
  route: faRoute,
  request: faPenToSquare,
  bell: faBell,
  arrowRight: faArrowRight,
  arrowLeft: faArrowLeft,
};

type DistributedModalComponent =
  | AvailabilityModalComponent
  | RequestModalComponent
  | WorkingTripModalComponent;
type ModalComponentType = DistributedModalComponent | DayworkModalComponent;
type buttonMode = 'ADD' | 'DELETE';

@Component({
  selector: 'app-interactive-button',
  templateUrl: './interactive-button.component.html',
  styleUrls: ['./interactive-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InteractiveButtonComponent implements AfterViewInit, OnDestroy {
  faIcons: any = faIcons;

  // Cache per evitare ricalcoli
  private _cachedDropdownId: string = '';
  private _cachedTargetId: string = '';
  private _cachedMenuId: string = '';

  @Input() set date(value: Date | undefined) {
    const newDate = value ? new Date(value) : undefined;
    const dateChanged =
      !this._date || !newDate || this._date.getTime() !== newDate.getTime();

    this._date = newDate;

    // Aggiorna cache ID solo se la data è cambiata
    if (dateChanged && this._date) {
      const isoString = this._date.toISOString();
      this._cachedDropdownId = 'dropdown-' + isoString;
      this._cachedTargetId = '#dropdownMenu-' + isoString;
      this._cachedMenuId = 'dropdownMenu-' + isoString;
    }

    // Recompute solo se necessario
    if (dateChanged) {
      this.recompute();
      this.cdr.markForCheck();
    }
  }
  public _date?: Date;

  @Input() dayClicked: Date = new Date();
  @Input() dayWorkDateTitle!: string;
  @Input() mode: buttonMode = 'ADD';

  @Input() set modalCalendarEntries(value: calendar | undefined) {
    // Verifica se i dati sono effettivamente cambiati
    if (this._allEntries !== value) {
      this._allEntries = value;
      this.recompute();
      this.cdr.markForCheck();
    }
  }
  private _allEntries: calendar | undefined;

  @ViewChild('working_trip_modal') workingTripModal!: WorkingTripModalComponent;
  @ViewChild('availability_modal')
  availabilityModal!: AvailabilityModalComponent;
  @ViewChild('request_modal') requestModal!: RequestModalComponent;
  @ViewChild('daywork_modal') dayworkModal!: DayworkModalComponent;

  // Arrays filtrati per ciascun tipo di entry
  filteredDayWorks: identifiableCalendarWorkingDay[] = [];
  filteredRequests: identifiableCalendarRequest[] = [];
  filteredWorkingTrips: identifiableCalendarWorkingTrip[] = [];
  filteredAvailabilities: identifiableCalendarAvailability[] = [];

  // Array combinato per retrocompatibilità
  filteredEntries: calendar = {
    day_works: [],
    requests: [],
    working_trips: [],
    availabilities: [],
  };

  // Flags precalcolati per il template
  isDayWorksDisabled = false;
  isRequestsDisabled = false;
  isWorkingTripsDisabled = false;
  isAvailabilitiesDisabled = false;

  constructor(
    private dateFormat: DateFormatService,
    private cdr: ChangeDetectorRef
  ) {}

  get tooltipTitle(): string {
    return this.mode === 'ADD'
      ? 'Aggiungi una nuova entry alla giornata'
      : 'Elimina una entry relativa alla giornata';
  }

  get buttonClasses(): any {
    return { 'btn-remove': this.mode === 'DELETE' };
  }

  get buttonIcon(): any {
    return this.mode === 'ADD' ? this.faIcons.plus : this.faIcons.minus;
  }

  get dropdownId(): string {
    return this._cachedDropdownId;
  }

  get dropdownTargetId(): string {
    return this._cachedTargetId;
  }

  get dropdownMenuId(): string {
    return this._cachedMenuId;
  }

  get isModalsModifyMode(): boolean {
    return this.mode === 'DELETE';
  }

  // TrackBy function per eventuali *ngFor
  trackByEntryId(index: number, item: any): any {
    return item.id || item.calendarEntry?.id || index;
  }

  // Metodo utilizzato per chiudere altri dropdown aperti quando se ne apre uno nuovo
  private hideOtherDropdowns(): void {
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach((el) => {
      el.addEventListener('show.bs.dropdown', () => {
        document.querySelectorAll('.dropdown-menu.show').forEach((openMenu) => {
          // se il menu aperto non è quello del trigger attuale → chiudi
          if (!el.nextElementSibling?.isSameNode(openMenu)) {
            const instance = bootstrap.Dropdown.getInstance(
              openMenu.previousElementSibling as Element
            );
            if (instance) {
              instance.hide();
            }
          }
        });
      });
    });
  }

  ngAfterViewInit() {
    this.hideOtherDropdowns();
    this.initializeBootstrapTooltips();
  }

  ngOnDestroy(): void {
    // Cleanup se necessario
  }

  initializeBootstrapTooltips(): void {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('.tt'));

    tooltipTriggerList.map((el: HTMLElement) => {
      new bootstrap.Tooltip(el, {
        trigger: 'hover', // solo hover, no focus/click
        placement: 'top',
        customClass: 'custom-tooltip',
      });
    });
  }

  openModal(modal: ModalComponentType): void {
    // dayworkmodal does not have currentDate input
    if (this._date && !(modal instanceof DayworkModalComponent)) {
      modal.currentDate = this._date;
    }
    modal.open();
  }

  private hasDateRange(
    entry:
      | CalendarAvailabilityEntry
      | CalendarRequestEntry
      | CalendarWorkingDayEntry
      | CalendarWorkingTripEntry
  ): entry is
    | CalendarAvailabilityEntry
    | CalendarRequestEntry
    | CalendarWorkingTripEntry {
    return 'dateFrom' in entry && 'dateTo' in entry;
  }

  private isWorkingDayEntry(
    entry:
      | CalendarAvailabilityEntry
      | CalendarRequestEntry
      | CalendarWorkingDayEntry
      | CalendarWorkingTripEntry
  ): entry is CalendarWorkingDayEntry {
    return 'dateFrom' in entry && !('dateTo' in entry);
  }

  // Versione ottimizzata del filtering
  private filterEntriesByDateOptimized<T extends identifiableCalendarEntry>(
    entries: T[],
    currentDate: Date,
    currentTime: number
  ): T[] {
    if (!entries?.length) return [];

    return entries.filter((entry: T) => {
      const calendarEntry = entry.calendarEntry;

      if (this.hasDateRange(calendarEntry)) {
        if (!calendarEntry.dateFrom || !calendarEntry.dateTo) return false;

        // Usa operazioni più veloci sulle date
        const fromTime = new Date(calendarEntry.dateFrom).setHours(0, 0, 0, 0);
        const toTime = new Date(calendarEntry.dateTo).setHours(23, 59, 59, 999);

        return currentTime >= fromTime && currentTime <= toTime;
      } else if (this.isWorkingDayEntry(calendarEntry)) {
        if (!calendarEntry.dateFrom) return false;

        const fromTime = new Date(calendarEntry.dateFrom).setHours(0, 0, 0, 0);
        return currentTime === fromTime;
      }

      return false;
    });
  }

  // Metodo recompute ottimizzato
  private recompute(): void {
    if (!this._date || !this._allEntries || !this.isModalsModifyMode) {
      this.resetFilteredArrays();
      this.updateDisabledFlags();
      return;
    }

    const current = this.dateFormat.normalizeDate(this._date);
    const currentTime = current.getTime();

    // Usa la versione ottimizzata del filtering
    this.filteredDayWorks = this.filterEntriesByDateOptimized(
      this._allEntries.day_works,
      current,
      currentTime
    );

    this.filteredRequests = this.filterEntriesByDateOptimized(
      this._allEntries.requests,
      current,
      currentTime
    );

    this.filteredWorkingTrips = this.filterEntriesByDateOptimized(
      this._allEntries.working_trips,
      current,
      currentTime
    );

    this.filteredAvailabilities = this.filterEntriesByDateOptimized(
      this._allEntries.availabilities,
      current,
      currentTime
    );

    // Aggiorna l'oggetto combinato
    this.filteredEntries = {
      day_works: this.filteredDayWorks,
      requests: this.filteredRequests,
      working_trips: this.filteredWorkingTrips,
      availabilities: this.filteredAvailabilities,
    };

    this.updateDisabledFlags();
  }

  // Precalcola i flag per il template
  private updateDisabledFlags(): void {
    this.isDayWorksDisabled =
      this.filteredEntries.day_works.length === 0 && this.mode === 'DELETE';
    this.isRequestsDisabled =
      this.filteredEntries.requests.length === 0 && this.mode === 'DELETE';
    this.isWorkingTripsDisabled =
      this.filteredEntries.working_trips.length === 0 && this.mode === 'DELETE';
    this.isAvailabilitiesDisabled =
      this.filteredEntries.availabilities.length === 0 &&
      this.mode === 'DELETE';
  }

  private resetFilteredArrays(): void {
    this.filteredDayWorks = [];
    this.filteredRequests = [];
    this.filteredWorkingTrips = [];
    this.filteredAvailabilities = [];
    this.filteredEntries = {
      day_works: [],
      requests: [],
      working_trips: [],
      availabilities: [],
    };
  }
}
