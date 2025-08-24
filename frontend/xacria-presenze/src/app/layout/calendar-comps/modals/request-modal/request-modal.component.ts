import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { request_types } from '../../const-vars';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modalComponent';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { faIcons } from '../../attendance/attendance.component';
import { CalendarRequestEntry } from 'src/generated-client';
import { identifiableCalendarRequest } from 'src/app/layout/shared/models/calendar';

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
  faIcons = faIcons;
  toDeleteEntries: identifiableCalendarRequest[] = [];
  @Output() saveRequest = new EventEmitter<CalendarRequestEntry>();

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private dateFormat: DateFormatService
  ) {}

  get requestType() {
    return this.form.get('request_type');
  }
  get dateFrom() {
    return this.form.get('date_from');
  }
  get dateTo() {
    return this.form.get('date_to');
  }
  get timeFrom() {
    return this.form.get('time_from');
  }
  get timeTo() {
    return this.form.get('time_to');
  }
  get requests() {
    return this.form.get('requests') as FormArray;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    if (!this.isModifyMode)
      this.form = this.fb.group({
        request_type: [null, Validators.required],
        date_from: [null, Validators.required],
        date_to: [null, Validators.required],
        time_from: [null, Validators.required],
        time_to: [null, Validators.required],
      });
    else this.initializeModifyForm();
  }

  submitForm(): void {
    if (this.form.valid) console.log(this.form.value);
    else console.error('Form invalido');
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
        },
        (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          this.initializeForm();
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
      date_from: [from, Validators.required],
      date_to: [to, Validators.required],
      time_from: [entry.calendarEntry.timeFrom, Validators.required],
      time_to: [entry.calendarEntry.timeTo, Validators.required],
      request_type: [entry.calendarEntry.requestType, Validators.required],
    });
  }

  toggleEntryDelete(entry: identifiableCalendarRequest, i: number) {
    if (this.toDeleteEntries.includes(entry)) {
      this.toDeleteEntries = this.toDeleteEntries.filter(
        (value: identifiableCalendarRequest) => value !== entry
      );
    } else {
      this.toDeleteEntries.push(entry);
    }
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
      this.saveRequest.emit(newEntry);
      this.form.reset();
    } else console.error('Availability new entry form is invalid');
  }
}
