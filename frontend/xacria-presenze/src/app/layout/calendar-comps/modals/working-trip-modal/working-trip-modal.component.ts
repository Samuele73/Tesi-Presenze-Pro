import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { inject, TemplateRef } from '@angular/core';

import {
  ModalDismissReasons,
  NgbDatepickerModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modalComponent';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { faIcons } from '../../attendance/attendance.component';
import { CalendarWorkingTripEntry } from 'src/generated-client';
import { identifiableCalendarWorkingTrip } from 'src/app/layout/shared/models/calendar';

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
  toDeleteEntries: identifiableCalendarWorkingTrip[] = [];
  faIcons = faIcons;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private dateFormat: DateFormatService
  ) {}

  get dateFrom() {
    return this.form.get('date_from');
  }
  get dateTo() {
    return this.form.get('date_to');
  }
  get workingTrips() {
    return this.form.get('working_trips') as FormArray;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    if (!this.isModifyMode)
      this.form = this.fb.group({
        date_from: [null, Validators.required],
        date_to: [null, Validators.required],
      });
    else this.initializeModifyForm();
  }

  initializeModifyForm(): void {
    let entries: any[] = [];
    this.calendarEntries.forEach((entry: identifiableCalendarWorkingTrip) => {
      entries.push(this.createWorkingTripGroup(entry));
    });
    this.form = this.fb.group({
      working_trips: this.fb.array(entries),
    });
  }

  createWorkingTripGroup(entry: identifiableCalendarWorkingTrip) {
    const from = this.dateFormat.formatToDateInput(
      entry.calendarEntry.dateFrom ?? new Date()
    );
    const to = this.dateFormat.formatToDateInput(entry.calendarEntry.dateTo ?? new Date());
    return this.fb.group({
      date_from: [from, Validators.required],
      date_to: [to, Validators.required],
    });
  }

  submitForm(): void {
    if (this.form.valid) console.log(this.form.value);
    else console.error('Form invalido');
  }

  open(): void {
    if ((!this.calendarEntries || !this.calendarEntries.length) && this.isModifyMode) return;

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

  toggleEntryDelete(entry: identifiableCalendarWorkingTrip, i: number) {
    console.log('CONTROLLA IL VALORE', entry, i);
    if (this.toDeleteEntries.includes(entry)) {
      this.toDeleteEntries = this.toDeleteEntries.filter(
        (value: identifiableCalendarWorkingTrip) => value !== entry
      );
    } else {
      this.toDeleteEntries.push(entry);
    }
  }
}
