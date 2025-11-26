import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { inject, TemplateRef } from '@angular/core';

import {
  ModalDismissReasons,
  NgbDatepickerModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modalComponent';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { faIcons } from '../../custom-calendar-page/custom-calendar-page.component';
import { CalendarWorkingTripEntry } from 'src/generated-client';
import { identifiableCalendarWorkingTrip } from 'src/app/modules/custom-calendar/models/calendar';
import { CalendarStateService } from '../../../services/calendar-state.service';
import { ToastrService } from 'ngx-toastr';
import { dateRangeValidator } from '../../../validators/dateRange.validators';

@Component({
  selector: 'app-working-trip-modal',
  templateUrl: './working-trip-modal.component.html',
  styleUrls: ['./working-trip-modal.component.scss'],
})
export class WorkingTripModalComponent implements ModalComponent, OnInit {
  @ViewChild('modal', { static: true }) modalElement!: ElementRef;
  closeResult = '';
  form!: FormGroup;
  @Input() isModifyMode!: boolean;
  @Input() calendarEntries!: identifiableCalendarWorkingTrip[];
  @Input() currentDate?: Date;
  toDeleteEntries: string[] = [];
  faIcons = faIcons;
  initialWorkingTrips: identifiableCalendarWorkingTrip[] = [];
  apiError: string | null = null;

  statusLabelMap: { [key: string]: string } = {
    PENDING: 'IN ATTESA',
    ACCEPTED: 'ACCETTATA',
    REJECTED: 'RIFIUTATA',
  };
  statusClassMap: { [key: string]: string } = {
    PENDING: 'bg-warning',
    ACCEPTED: 'bg-primary',
    REJECTED: 'bg-danger',
  };
  todayString = new Date().toISOString().split('T')[0];

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private dateFormat: DateFormatService,
    private calendarStateService: CalendarStateService,
    private toastrService: ToastrService
  ) {}

  get dateFrom() {
    return this.form.get('dateFrom');
  }
  get dateTo() {
    return this.form.get('dateTo');
  }
  get workingTrips() {
    return this.form.get('working_trips') as FormArray;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  activePanelIndex: number | null = null;

  togglePanel(index: number) {
    this.activePanelIndex = this.activePanelIndex === index ? null : index;
  }

  initializeForm(): void {
    if (!this.isModifyMode) {
      const formattedCurrentDate = this.dateFormat.manuallyFormatToDateInput(
        this.currentDate ?? new Date()
      );
      this.form = this.fb.group(
        {
          dateFrom: [formattedCurrentDate, Validators.required],
          dateTo: [formattedCurrentDate, Validators.required],
        },
        {
          validators: dateRangeValidator('dateFrom', 'dateTo'),
        }
      );
    } else this.initializeModifyForm();
  }

  private emptyToDeleteEntries(): void {
    this.toDeleteEntries = [];
  }

  initializeModifyForm(): void {
    let entries: any[] = [];
    this.calendarEntries.forEach((entry: identifiableCalendarWorkingTrip) => {
      entries.push(this.createWorkingTripGroup(entry));
    });
    this.form = this.fb.group({
      working_trips: this.fb.array(entries),
    });
    this.disableClosedRequests();
  }

  createWorkingTripGroup(entry: identifiableCalendarWorkingTrip) {
    const from = this.dateFormat.formatToDateInput(
      entry.calendarEntry.dateFrom ?? new Date()
    );
    const to = this.dateFormat.formatToDateInput(
      entry.calendarEntry.dateTo ?? new Date()
    );
    return this.fb.group(
      {
        id: [entry.id],
        dateFrom: [from, Validators.required],
        dateTo: [to, Validators.required],
        status: [entry.calendarEntry.status],
      },
      {
        validators: dateRangeValidator('dateFrom', 'dateTo'),
      }
    );
  }

  private updateEntries(): void {
    const currentEntries: ({ id: string } & CalendarWorkingTripEntry)[] =
      this.workingTrips.value;
    let result: boolean = false;
    const changedEntries: identifiableCalendarWorkingTrip[] = currentEntries
      .filter((entry: { id: string } & CalendarWorkingTripEntry, i) => {
        const initial = this.initialWorkingTrips[i];
        return JSON.stringify(entry) !== JSON.stringify(initial);
      })
      .map((entry: { id: string } & CalendarWorkingTripEntry) => {
        return {
          id: entry.id,
          calendarEntry: {
            dateFrom: entry.dateFrom,
            dateTo: entry.dateTo,
          },
        };
      });
    console.log('To updated entries', changedEntries);
    this.calendarStateService
      .updateCalendarEntries(changedEntries, 'WORKING_TRIP')
      .subscribe((resp: boolean) => {
        if (resp){
          this.toastrService.clear();
          this.toastrService.success('Trasferta modificata con successo');
        }
      });
    this.initialWorkingTrips = this.workingTrips.value;
  }

  private disableClosedRequests(): void {
    if (this.isModifyMode) {
      this.workingTrips.controls.forEach((group, i) => {
        const status = group.get('status')?.value;

        if (this.isWorkingTripModifyForbidden(status)) {
          group.disable({ emitEvent: false });
        } else {
          group.enable({ emitEvent: false });
        }
      });
    }
  }

  private isWorkingTripModifyForbidden(status: string): boolean {
    return status === 'ACCEPTED' || status === 'REJECTED';
  }

  private deleteEntries(): void {
    if (this.toDeleteEntries.length) {
      this.calendarStateService
        .deleteCalendarEntities(this.toDeleteEntries, 'WORKING_TRIP')
        .subscribe((resp: boolean) => {
          if (resp){
            this.toastrService.clear();
            this.toastrService.success('Trasferte cancellate con successo');
          }
        });
      this.toDeleteEntries = [];
    }
  }

  submitModifyModeForm(): void {
    if (!this.form.valid) {
      console.error('Availability modify form is invalid');
      return;
    }

    this.updateEntries();
    this.deleteEntries();

    this.modalService.dismissAll();
  }

  open(): void {
    if (
      (!this.calendarEntries || !this.calendarEntries.length) &&
      this.isModifyMode
    )
      return;

    if (this.isModifyMode) {
      this.initializeModifyForm();
    } else {
      this.initializeForm();
    }

    this.modalService
      .open(this.modalElement, {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'custom-modal',
      })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
          this.emptyToDeleteEntries();
        },
        (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          this.initializeForm();
          this.emptyToDeleteEntries();
        }
      );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  toggleEntryDelete(entry: identifiableCalendarWorkingTrip, i: number): void {
    const entryId = entry.id;
    console.log('CONTROLLA IL VALORE ava', entryId, i);
    if (this.toDeleteEntries.includes(entryId)) {
      this.toDeleteEntries = this.toDeleteEntries.filter(
        (value: string) => value !== entryId
      );
    } else {
      this.toDeleteEntries.push(entryId);
    }
  }

  submitNewEntry(): void {
    if (this.form.valid) {
      const newEntry: CalendarWorkingTripEntry = {
        dateFrom: this.dateFrom?.value,
        dateTo: this.dateTo?.value,
      };
      this.calendarStateService
        .saveCalendarEntry(newEntry, 'WORKING_TRIP')
        .subscribe((resp: boolean) => {
          if (resp)
            this.toastrService.success('Trasferta creata con successo');

        });
      this.form.reset();
    } else console.error('Availability new entry form is invalid');
  }
}
