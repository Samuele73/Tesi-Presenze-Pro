import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modalComponent';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { faIcons } from '../../custom-calendar-page/custom-calendar-page.component';
import { CalendarRequestEntry } from 'src/generated-client';
import { identifiableCalendarRequest } from 'src/app/modules/custom-calendar/models/calendar';
import { request_types } from '../../../const-vars';
import { CalendarStateService } from '../../../services/calendar-state.service';

@Component({
  selector: 'app-request-modal',
  templateUrl: './request-modal.component.html',
  styleUrls: ['./request-modal.component.scss'],
})
export class RequestModalComponent implements ModalComponent, OnInit {
  request_types: any = request_types;
  @ViewChild('modal', { static: true }) modalElement!: ElementRef;
  closeResult = '';
  form!: FormGroup;
  @Input() isModifyMode!: boolean;
  @Input() calendarEntries!: identifiableCalendarRequest[];
  @Input() currentDate?: Date;
  faIcons = faIcons;
  toDeleteEntries: string[] = [];
  initialRequests: identifiableCalendarRequest[] = [];

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private dateFormat: DateFormatService,
    private calendarStateService: CalendarStateService
  ) {}

  get requestType() {
    return this.form.get('requestType');
  }
  get dateFrom() {
    return this.form.get('dateFrom');
  }
  get dateTo() {
    return this.form.get('dateTo');
  }
  get timeFrom() {
    return this.form.get('timeFrom');
  }
  get timeTo() {
    return this.form.get('timeTo');
  }
  get requests() {
    return this.form.get('requests') as FormArray;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    console.log('initialized date', this.currentDate);
    if (!this.isModifyMode) {
      const formattedCurrentDate = this.dateFormat.manuallyFormatToDateInput(
        this.currentDate ?? new Date()
      );
      this.form = this.fb.group({
        requestType: [request_types[0], Validators.required],
        dateFrom: [formattedCurrentDate, Validators.required],
        dateTo: [formattedCurrentDate, Validators.required],
        timeFrom: [null, Validators.required],
        timeTo: [null, Validators.required],
      });
    } else this.initializeModifyForm();
  }

  private emptyToDeleteEntries(): void {
    this.toDeleteEntries = [];
  }

  private updateEntries(): void {
    const currentEntries: ({ id: string } & CalendarRequestEntry)[] =
      this.requests.value;
    const changedEntries: identifiableCalendarRequest[] = currentEntries
      .filter((entry: { id: string } & CalendarRequestEntry, i) => {
        const initial = this.initialRequests[i];
        return JSON.stringify(entry) !== JSON.stringify(initial);
      })
      .map((entry: { id: string } & CalendarRequestEntry) => {
        return {
          id: entry.id,
          calendarEntry: {
            dateFrom: entry.dateFrom,
            dateTo: entry.dateTo,
            timeFrom: entry.timeFrom,
            timeTo: entry.timeTo,
            requestType: entry.requestType,
          },
        };
      });
    console.log('To updated entries', changedEntries);
    this.calendarStateService.updateCalendarEntries(changedEntries, 'REQUEST');
    this.initialRequests = this.requests.value;
  }

  private deleteEntries(): void {
    console.log("to delete entries lenght", this.toDeleteEntries.length, this.toDeleteEntries)
    if (this.toDeleteEntries.length) {
      console.log("i am about to delete", this.toDeleteEntries)
      this.calendarStateService.deleteCalendarEntities(this.toDeleteEntries, 'REQUEST');
      this.toDeleteEntries = [];
    }
  }

  submitModifyModeForm(): void {
    if (!this.form.valid) {
      console.error('Availability modify form is invalid');
      return;
    }
    console.log("check here", this.form, this.toDeleteEntries)
    this.deleteEntries();
    this.updateEntries();

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

  initializeModifyForm(): void {
    let entries: FormGroup[] = [];
    this.calendarEntries.forEach((entry) => {
      entries.push(this.createRequestGroup(entry));
    });
    this.form = this.fb.group({
      requests: this.fb.array(entries),
    });
  }

  createRequestGroup(entry: identifiableCalendarRequest) {
    const from = this.dateFormat.formatToDateInput(
      entry.calendarEntry.dateFrom ?? new Date()
    );
    const to = this.dateFormat.formatToDateInput(
      entry.calendarEntry.dateTo ?? new Date()
    );
    return this.fb.group({
      id: [entry.id],
      dateFrom: [from, Validators.required],
      dateTo: [to, Validators.required],
      timeFrom: [entry.calendarEntry.timeFrom, Validators.required],
      timeTo: [entry.calendarEntry.timeTo, Validators.required],
      requestType: [entry.calendarEntry.requestType, Validators.required],
    });
  }

  toggleEntryDelete(entry: identifiableCalendarRequest, i: number): void {
    const entryId = entry.id;
    console.log('CONTROLLA IL VALORE ava', entryId, i);
    if (this.toDeleteEntries.includes(entryId)) {
      this.toDeleteEntries = this.toDeleteEntries.filter(
        (value: string) => value !== entryId
      );
    } else {
      this.toDeleteEntries.push(entryId);
    }
    console.log("status to delete entries:", this.toDeleteEntries)
  }

  submitNewEntry(): void {
    if (this.form.valid) {
      const newEntry: CalendarRequestEntry = {
        dateFrom: this.dateFrom?.value,
        dateTo: this.dateTo?.value,
        requestType: this.requestType?.value,
        timeFrom: this.timeFrom?.value,
        timeTo: this.timeTo?.value,
      };
      this.calendarStateService.saveCalendarEntry(newEntry, 'REQUEST');
      this.form.reset();
    } else console.error('Availability new entry form is invalid');
  }
}
