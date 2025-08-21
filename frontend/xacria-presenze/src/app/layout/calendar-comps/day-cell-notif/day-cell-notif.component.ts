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
  CalendarRequestEntry,
  CalendarWorkingDayEntry,
  CalendarWorkingTripEntry,
} from 'src/generated-client';

// ... (imports remain the same)

@Component({
  selector: 'app-day-cell-notif',
  templateUrl: './day-cell-notif.component.html',
  styleUrls: ['./day-cell-notif.component.scss'],
})
export class DayCellNotifComponent implements OnInit, OnChanges, AfterViewInit  {
  @Input() icon!: IconDefinition;
  @Input() text!: string;
  @Input() notifType!: CalendarEntryType;
  @Input() dateString?: string;
  @Input() modalModify!: boolean;

  // Usa dei setter per catturare i cambiamenti degli input
  @Input() set modalCalendarEntries(value: Array<CalendarWorkingDayEntry | CalendarRequestEntry | CalendarWorkingTripEntry | CalendarAvailabilityEntry> | undefined) {
    this._allEntries = value ?? [];
    this.recompute();
  }
  @Input() set date(value: Date | undefined) {
    this._date = value ? new Date(value) : undefined;
    this.recompute();
  }

  private _allEntries: Array<CalendarWorkingDayEntry | CalendarRequestEntry | CalendarWorkingTripEntry | CalendarAvailabilityEntry> = [];
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
  filteredEntries: Array<CalendarWorkingDayEntry | CalendarRequestEntry | CalendarWorkingTripEntry | CalendarAvailabilityEntry> = [];

  constructor(private dateFormat: DateFormatService) {}
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.isTemplateReady = true;
    }, 0); // Ensure templates are ready after view init. It fixes a bug where templates are not ready immediately while anguular is on change detection.
  }

  // L'hook ngOnChanges non è più necessario se usi i setter
  ngOnChanges(changes: SimpleChanges): void {}
  ngOnInit(): void {}

  private recompute(): void {
    if (!this._date || !this._allEntries) {
      this.filteredEntries = [];
      this.notifs = 0;
      return;
    }

    const current = this.dateFormat.normalizeDate(this._date);
    this.filteredEntries = this._allEntries.filter((entry) => {
      if (!this.hasDateRange(entry)) return false;
      const from = this.dateFormat.normalizeDate(entry.dateFrom);
      const to = this.dateFormat.normalizeDate(entry.dateTo);
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
      case CalendarEntryType.WORKING_DAY:
        return this.dayworkTemplate;
      case CalendarEntryType.REQUEST:
        return this.requestTemplate;
      case CalendarEntryType.WORKING_TRIP:
        return this.workingTripTemplate;
      case CalendarEntryType.AVAILABILITY:
        return this.availabilityTemplate;
    }
  }

  private hasDateRange(entry: any): entry is { dateFrom: any; dateTo: any } {
    return entry && 'dateFrom' in entry && 'dateTo' in entry;
  }
}
