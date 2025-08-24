import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { CalendarEntryType } from '../../interfaces';
import { ViewChild } from '@angular/core';
import { WorkingTripModalComponent } from '../modals/working-trip-modal/working-trip-modal.component';
import { AvailabilityModalComponent } from '../modals/availability-modal/availability-modal.component';
import { RequestModalComponent } from '../modals/request-modal/request-modal.component';
import { DayworkModalComponent } from '../modals/daywork-modal/daywork-modal.component';
import { ModalComponent } from '../modals/modalComponent';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import {
  CalendarAvailabilityEntry,
  CalendarEntity,
  CalendarEntry,
  CalendarRequestEntry,
  CalendarWorkingDayEntry,
  CalendarWorkingTripEntry,
} from 'src/generated-client';
import { identifiableCalendarAvailability, identifiableCalendarEntry, identifiableCalendarRequest, identifiableCalendarWorkingDay, identifiableCalendarWorkingTrip } from '../../shared/models/calendar';
import { CalendarStateService } from '../../shared/services/calendar-state.service';

// ... (imports remain the same)

@Component({
  selector: 'app-day-cell-notif',
  templateUrl: './day-cell-notif.component.html',
  styleUrls: ['./day-cell-notif.component.scss'],
})
export class DayCellNotifComponent implements OnInit, OnChanges, AfterViewInit  {
  @Input() icon!: IconDefinition;
  @Input() text!: string;
  @Input() notifType!: CalendarEntity.EntryTypeEnum;
  @Input() dateString?: string;
  @Input() modalModify!: boolean;

  // Usa dei setter per catturare i cambiamenti degli input
  @Input() set modalCalendarEntries(value: Array<identifiableCalendarWorkingDay | identifiableCalendarRequest | identifiableCalendarWorkingTrip | identifiableCalendarAvailability> | undefined) {
    this._allEntries = value ?? [];
    this.recompute();
  }
  @Input() set date(value: Date | undefined) {
    this._date = value ? new Date(value) : undefined;
    this.recompute();
  }

  private _allEntries: Array<identifiableCalendarWorkingDay | identifiableCalendarRequest | identifiableCalendarWorkingTrip | identifiableCalendarAvailability> = [];
  private _date?: Date;

  @ViewChild('modal') modal!: ModalComponent;
  @ViewChild('dayworkTemplate')
  dayworkTemplate!: TemplateRef<DayworkModalComponent>;
  @ViewChild('requestTemplate')
  requestTemplate!: TemplateRef<RequestModalComponent>;
  @ViewChild('workingTripTemplate')
  workingTripTemplate!: TemplateRef<WorkingTripModalComponent>;
  @ViewChild('availabilityTemplate')
  availabilityTemplate!: TemplateRef<AvailabilityModalComponent>;
  isTemplateReady = false;

  CalendarEntryType = CalendarEntryType;
  notifs: number = 0;
  filteredEntries: Array<identifiableCalendarEntry> = [];

  constructor(private dateFormat: DateFormatService, private calendarStateService: CalendarStateService) {}
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.isTemplateReady = true;
    }, 0); // Ensure templates are ready after view init. It fixes a bug where templates are not ready immediately while anguular is on change detection.
  }

  ngOnChanges(changes: SimpleChanges): void {}
  ngOnInit(): void {}

  private hasDateRange(entry: any): entry is { dateFrom: any; dateTo: any } {
    return entry && 'dateFrom' in entry && 'dateTo' in entry;
  }

  //To check if the entry is a WORKING_DAY entry
  private areWorkingDayEntries(entry: any): entry is { dateFrom: any } {
    return entry && 'dateFrom' in entry;
  }

  // Recompute the filtered entries based on the current date and all entries
  private recompute(): void {
    if (!this._date || !this._allEntries) {
      this.filteredEntries = [];
      this.notifs = 0;
      //console.log('No date or entries provided');
      return;
    }

    const current = this.dateFormat.normalizeDate(this._date);
    this.filteredEntries = this._allEntries.filter((entry: identifiableCalendarEntry) => {
      const calendarEntry: CalendarEntry = entry.calendarEntry;
      if (!this.hasDateRange(calendarEntry)){
        if(this.areWorkingDayEntries(calendarEntry)) {
          const from = this.dateFormat.normalizeDate(calendarEntry.dateFrom);
          //console.log('Current date:', current, 'From date:', from, "result", current === from);
          return current.getTime() === from.getTime();
        }
        return false;
      }
      const from = this.dateFormat.normalizeDate(calendarEntry.dateFrom);
      const to = this.dateFormat.normalizeDate(calendarEntry.dateTo);
      return current >= from && current <= to;
    });
    this.notifs = this.filteredEntries.length;
  }

  openModifyModal(): void {
    if (!this.filteredEntries.length) return;
    this.modal?.open();
  }

  getTemplate(): TemplateRef<any> {
    switch (this.notifType) {
      case 'WORKING_DAY':
        return this.dayworkTemplate;
      case 'REQUEST':
        return this.requestTemplate;
      case 'WORKING_TRIP':
        return this.workingTripTemplate;
      case 'AVAILABILITY':
        return this.availabilityTemplate;
    }
  }

  handleBulkDelete(entryIds: string[], entryType: CalendarEntity.EntryTypeEnum): void {
    console.log('BULK DELETE', entryIds, entryType);
    this.calendarStateService.deleteCalendarEntities(entryIds, entryType);
  }

  handleModifyEntries(event: any, calenarEntryType: CalendarEntryType): void {

  }

}
