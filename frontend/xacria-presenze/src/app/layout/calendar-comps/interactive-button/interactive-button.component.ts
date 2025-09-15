import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
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
import {
  identifiableCalendarAvailability,
  identifiableCalendarEntry,
  identifiableCalendarRequest,
  identifiableCalendarWorkingDay,
  identifiableCalendarWorkingTrip,
  calendar,
} from '../../shared/models/calendar';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import {
  CalendarAvailabilityEntry,
  CalendarRequestEntry,
  CalendarWorkingDayEntry,
  CalendarWorkingTripEntry,
} from 'src/generated-client';

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
})
export class InteractiveButtonComponent implements AfterViewInit {
  faIcons: any = faIcons;

  @Input() set date(value: Date | undefined) {
    this._date = value ? new Date(value) : undefined;
    console.log('DATE SETTER CALLED', this._date, value);
    this.recompute();
  }
  public _date?: Date;

  @Input() dayClicked: Date = new Date();
  @Input() dayWorkDateTitle!: string;
  @Input() mode: buttonMode = 'ADD';

  @Input() set modalCalendarEntries(value: calendar | undefined) {
    this._allEntries = value;
    this.recompute();
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

  constructor(private dateFormat: DateFormatService) {}

  get isModalsModifyMode(): boolean {
    return this.mode === 'DELETE';
  }

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

  initializeBootstrapTooltips(): void {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('.tt'));
    tooltipTriggerList.map((el: HTMLElement) => {
      new bootstrap.Tooltip(el, {
        trigger: 'hover',
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

  private filterEntriesByDate<T extends identifiableCalendarEntry>(
    entries: T[],
    currentDate: Date
  ): T[] {
    return entries.filter((entry: T) => {
      const calendarEntry = entry.calendarEntry;

      if (this.hasDateRange(calendarEntry)) {
        // Controlla che dateFrom e dateTo non siano undefined
        if (!calendarEntry.dateFrom || !calendarEntry.dateTo) {
          return false;
        }
        const from = this.dateFormat.normalizeDate(calendarEntry.dateFrom);
        const to = this.dateFormat.normalizeDate(calendarEntry.dateTo);
        return currentDate >= from && currentDate <= to;
      } else if (this.isWorkingDayEntry(calendarEntry)) {
        // Controlla che dateFrom non sia undefined
        if (!calendarEntry.dateFrom) {
          return false;
        }
        const from = this.dateFormat.normalizeDate(calendarEntry.dateFrom);
        return currentDate.getTime() === from.getTime();
      }

      return false;
    });
  }

  /* onDropdownToggle(event: Event): void {
    // Chiudi tutti gli altri dropdown aperti
    const allDropdowns = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    allDropdowns.forEach((dropdown) => {
      if (dropdown !== event.target) {
        const dropdownInstance = bootstrap.Dropdown.getInstance(dropdown);
        if (dropdownInstance) {
          dropdownInstance.hide();
        }
      }
    });
  } */

  // Recompute the filtered entries based on the current date and all entries
  private recompute(): void {
    // Reset tutti gli array filtrati
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

    if (!this._date || !this._allEntries || !this.isModalsModifyMode) {
      console.log('No date or entries provided, or in modify mode');
      return;
    }
    console.log('Date and entries provided:', this._date, this._allEntries);

    const current = this.dateFormat.normalizeDate(this._date);

    this.filteredDayWorks = this.filterEntriesByDate(
      this._allEntries.day_works,
      current
    );

    this.filteredRequests = this.filterEntriesByDate(
      this._allEntries.requests,
      current
    );

    this.filteredWorkingTrips = this.filterEntriesByDate(
      this._allEntries.working_trips,
      current
    );

    this.filteredAvailabilities = this.filterEntriesByDate(
      this._allEntries.availabilities,
      current
    );

    // Combina tutti gli array filtrati per retrocompatibilità
    this.filteredEntries = {
      day_works: this.filteredDayWorks,
      requests: this.filteredRequests,
      working_trips: this.filteredWorkingTrips,
      availabilities: this.filteredAvailabilities,
    };
    console.log('Filtered Entries:', this.filteredEntries);
  }
}
