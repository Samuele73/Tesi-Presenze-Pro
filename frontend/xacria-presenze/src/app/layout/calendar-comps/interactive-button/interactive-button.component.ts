import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
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
} from '../../shared/models/calendar';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { CalendarEntry } from 'src/generated-client';

declare var bootstrap: any;
const faIcons = { plus: faPlus, minus: faMinus };

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
    this.recompute();
  }
  private _date?: Date;
  @Input() dayClicked: Date = new Date();
  @Input() dayWorkDateTitle!: string;
  @Input() mode: buttonMode = 'ADD';
  @Input() set modalCalendarEntries(
    value:
      | Array<
          | identifiableCalendarWorkingDay
          | identifiableCalendarRequest
          | identifiableCalendarWorkingTrip
          | identifiableCalendarAvailability
        >
      | undefined
  ) {
    this._allEntries = value ?? [];
    this.recompute();
  }
  private _allEntries: Array<
    | identifiableCalendarWorkingDay
    | identifiableCalendarRequest
    | identifiableCalendarWorkingTrip
    | identifiableCalendarAvailability
  > = [];
  @ViewChild('working_trip_modal') workingTripModal!: WorkingTripModalComponent;
  @ViewChild('availability_modal')
  availabilityModal!: AvailabilityModalComponent;
  @ViewChild('request_modal') requestModal!: RequestModalComponent;
  @ViewChild('daywork_modal') dayworkModal!: DayworkModalComponent;
  filteredEntries: Array<identifiableCalendarEntry> = [];

  constructor(private dateFormat: DateFormatService) {}

  get isModalsModifyMode(): boolean {
    return this.mode === 'DELETE';
  }

  ngAfterViewInit(): void {
    this.initializeBootstrapTooltips();
  }

  initializeBootstrapTooltips(): void {
    const tooltipTriggerList = document.querySelectorAll('.tt');
    tooltipTriggerList.forEach(
      (el) =>
        new bootstrap.Tooltip(el, {
          container: 'body',
          customClass: 'custom-tooltip',
        })
    );
  }

  openModal(modal: ModalComponentType, date?: Date): void {
    //dayworkmodal does not have currentDate input
    if (date && !(modal instanceof DayworkModalComponent)) {
      console.log('date:', date);
      modal.currentDate = date;
      console.log('modal date:', modal.currentDate);
    }
    modal.open();
  }

  private hasDateRange(entry: any): entry is { dateFrom: any; dateTo: any } {
    return entry && 'dateFrom' in entry && 'dateTo' in entry;
  }

  private areWorkingDayEntries(entry: any): entry is { dateFrom: any } {
    return entry && 'dateFrom' in entry;
  }

  // Recompute the filtered entries based on the current date and all entries
  private recompute(): void {
    if (!this._date || !this._allEntries || this.isModalsModifyMode) {
      this.filteredEntries = [];
      //console.log('No date or entries provided');
      return;
    }

    const current = this.dateFormat.normalizeDate(this._date);
    this.filteredEntries = this._allEntries.filter(
      (entry: identifiableCalendarEntry) => {
        const calendarEntry: CalendarEntry = entry.calendarEntry;
        if (!this.hasDateRange(calendarEntry)) {
          if (this.areWorkingDayEntries(calendarEntry)) {
            const from = this.dateFormat.normalizeDate(calendarEntry.dateFrom);
            //console.log('Current date:', current, 'From date:', from, "result", current === from);
            return current.getTime() === from.getTime();
          }
          return false;
        }
        const from = this.dateFormat.normalizeDate(calendarEntry.dateFrom);
        const to = this.dateFormat.normalizeDate(calendarEntry.dateTo);
        return current >= from && current <= to;
      }
    );
  }
}
