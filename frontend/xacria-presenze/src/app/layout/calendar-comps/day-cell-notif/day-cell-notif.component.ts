import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
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

@Component({
  selector: 'app-day-cell-notif',
  templateUrl: './day-cell-notif.component.html',
  styleUrls: ['./day-cell-notif.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DayCellNotifComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() icon!: IconDefinition;
  @Input() text!: string;
  @Input() notifType!: CalendarEntity.EntryTypeEnum;
  @Input() dateString?: string;
  @Input() modalModify!: boolean;

  // Cache per template selection
  private _selectedTemplate?: TemplateRef<any>;
  private _lastNotifType?: CalendarEntity.EntryTypeEnum;

  // Usa dei setter ottimizzati per catturare i cambiamenti degli input
  @Input() set modalCalendarEntries(value: Array<identifiableCalendarWorkingDay | identifiableCalendarRequest | identifiableCalendarWorkingTrip | identifiableCalendarAvailability> | undefined) {
    const newEntries = value ?? [];
    // Verifica se gli entries sono effettivamente cambiati
    if (this._allEntries !== newEntries) {
      this._allEntries = newEntries;
      this.recompute();
      this.cdr.markForCheck();
    }
  }

  @Input() set date(value: Date | undefined) {
    const newDate = value ? new Date(value) : undefined;
    const dateChanged = !this._date || !newDate || this._date.getTime() !== newDate.getTime();

    if (dateChanged) {
      this._date = newDate;
      this.recompute();
      this.cdr.markForCheck();
    }
  }

  private _allEntries: Array<identifiableCalendarWorkingDay | identifiableCalendarRequest | identifiableCalendarWorkingTrip | identifiableCalendarAvailability> = [];
  public _date?: Date;

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

  // Proprietà cached per il template
  private _buttonText: string = '';
  private _buttonClasses: any = {};
  private _hasNotifications = false;

  constructor(
    private dateFormat: DateFormatService,
    private calendarStateService: CalendarStateService,
    private cdr: ChangeDetectorRef
  ) {}

  // Getter ottimizzati per il template
  get buttonText(): string {
    return this._buttonText;
  }

  get buttonClasses(): any {
    return this._buttonClasses;
  }

  get hasNotifications(): boolean {
    return this._hasNotifications;
  }


  ngAfterViewInit(): void {
    // Usa requestAnimationFrame invece di setTimeout per miglior performance
    requestAnimationFrame(() => {
      this.isTemplateReady = true;
      this.updateTemplate();
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Aggiorna template solo se notifType è cambiato
    if (changes['notifType'] && this.isTemplateReady) {
      this.updateTemplate();
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    // Cleanup se necessario
  }

  private hasDateRange(entry: any): entry is { dateFrom: any; dateTo: any } {
    return entry && 'dateFrom' in entry && 'dateTo' in entry;
  }

  // To check if the entry is a WORKING_DAY entry
  private areWorkingDayEntries(entry: any): entry is { dateFrom: any } {
    return entry && 'dateFrom' in entry;
  }

  // Metodo di filtering ottimizzato
  private filterEntriesByDateOptimized(
    entries: Array<identifiableCalendarEntry>,
    currentDate: Date,
    currentTime: number
  ): Array<identifiableCalendarEntry> {
    if (!entries?.length) return [];

    return entries.filter((entry: identifiableCalendarEntry) => {
      const calendarEntry: CalendarEntry = entry.calendarEntry;

      if (!this.hasDateRange(calendarEntry)) {
        if (this.areWorkingDayEntries(calendarEntry)) {
          const fromTime = new Date(calendarEntry.dateFrom).setHours(0, 0, 0, 0);
          return currentTime === fromTime;
        }
        return false;
      }

      const fromTime = new Date(calendarEntry.dateFrom).setHours(0, 0, 0, 0);
      const toTime = new Date(calendarEntry.dateTo).setHours(23, 59, 59, 999);
      return currentTime >= fromTime && currentTime <= toTime;
    });
  }

  // Metodo utilizzato per ricalcolare filteredEntries e notifs
  private recompute(): void {
    if (!this._date || !this._allEntries?.length) {
      this.filteredEntries = [];
      this.notifs = 0;
      this.updateCachedProperties();
      return;
    }

    const current = this.dateFormat.normalizeDate(this._date);
    const currentTime = current.getTime();

    // Usa il metodo ottimizzato
    this.filteredEntries = this.filterEntriesByDateOptimized(
      this._allEntries,
      current,
      currentTime
    );

    this.notifs = this.filteredEntries.length;
    this.updateCachedProperties();
  }

  // Aggiorna le proprietà cached per il template
  private updateCachedProperties(): void {
    this._buttonText = this.notifs + " " + this.text;
    this._hasNotifications = this.notifs > 0;
    this._buttonClasses = {
      'bg-primary': this._hasNotifications,
      'bg-secondary': !this._hasNotifications
    };
  }

  private updateTemplate(): void {
    if (this._lastNotifType === this.notifType && this._selectedTemplate) {
      return; // Template già cached
    }

    this._lastNotifType = this.notifType;
    this._selectedTemplate = this.getTemplateInternal();
  }

  openModifyModal(): void {
    if (!this.filteredEntries.length) return;
    this.modal?.open();
  }

  getTemplate(): TemplateRef<any> {
    if (!this._selectedTemplate || this._lastNotifType !== this.notifType) {
      this.updateTemplate();
    }
    return this._selectedTemplate!;
  }

  // Metodo interno per la selezione del template
  private getTemplateInternal(): TemplateRef<any> {
    switch (this.notifType) {
      case 'WORKING_DAY':
        return this.dayworkTemplate;
      case 'REQUEST':
        return this.requestTemplate;
      case 'WORKING_TRIP':
        return this.workingTripTemplate;
      case 'AVAILABILITY':
        return this.availabilityTemplate;
      default:
        return this.dayworkTemplate; // fallback
    }
  }

  // TrackBy function per eventuali *ngFor
  trackByEntryId(index: number, item: identifiableCalendarEntry): any {
    return item.id || item.id || index;
  }
}
