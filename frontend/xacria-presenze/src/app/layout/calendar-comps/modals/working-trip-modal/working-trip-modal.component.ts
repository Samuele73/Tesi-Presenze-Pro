import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import {  inject, TemplateRef } from '@angular/core';

import { ModalDismissReasons, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modalComponent';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalendarWorkingTripEntry } from 'src/app/layout/interfaces';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { faIcons } from '../../attendance/attendance.component';

@Component({
  selector: 'app-working-trip-modal',
  templateUrl: './working-trip-modal.component.html',
  styleUrls: ['./working-trip-modal.component.scss']
})
export class WorkingTripModalComponent implements ModalComponent, OnInit{
  @ViewChild("modal", {static: true}) modalElement!: ElementRef;
  closeResult = '';
  form!: FormGroup;
  @Input() isModifyMode!: boolean;
  @Input() calendarEntries!: CalendarWorkingTripEntry[];
  toDeleteEntries: CalendarWorkingTripEntry[] = [];
  faIcons = faIcons;

	constructor(private modalService: NgbModal, private fb: FormBuilder, private dateFormat: DateFormatService) {

  }

  get dateFrom(){return this.form.get("date_from");}
  get dateTo(){return this.form.get("date_to");}
  get workingTrips(){return this.form.get("working_trips") as FormArray;}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void{
    if(!this.isModifyMode)
      this.form = this.fb.group({
        date_from: [null, Validators.required],
        date_to: [null, Validators.required]
      })
    else
      this.initializeModifyForm();
  }

  initializeModifyForm(): void{
    let entries: any[] = [];
    this.calendarEntries.forEach((entry: CalendarWorkingTripEntry) => {
      entries.push(this.createWorkingTripGroup(entry));
    })
    this.form = this.fb.group({
      working_trips: this.fb.array(entries)
    })
  }

  createWorkingTripGroup(entry: CalendarWorkingTripEntry){
    const from = this.dateFormat.formatToDateInput(entry.date_from);
    const to = this.dateFormat.formatToDateInput(entry.date_to);
    return this.fb.group({
      date_from: [from, Validators.required],
      date_to: [to, Validators.required]
    });
  }

  submitForm(): void{
    if(this.form.valid)
      console.log(this.form.value);
    else
      console.error("Form invalido");
  }

	open(): void{
    this.modalService.open(this.modalElement, { ariaLabelledBy: 'modal-basic-title', windowClass: "custom-modal"}).result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        this.initializeForm();
      },
    );

    /* this.dateFrom?.setValue(this.parseDate(this.date));
    this.cdr.detectChanges(); */
  }

	private getDismissReason(reason: any): string{
		if (reason === ModalDismissReasons.ESC) {
			return 'by pressing ESC';
		} else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
			return 'by clicking on a backdrop';
		} else {
			return `with: ${reason}`;
		}
	}

  toggleEntryDelete(entry: any, i: number){
    console.log("CONTROLLA IL VALORE", entry, i);
    if (this.toDeleteEntries.includes(entry)) {
      this.toDeleteEntries = this.toDeleteEntries.filter((value: CalendarWorkingTripEntry) => value !== entry);
    } else {
      this.toDeleteEntries.push(entry);
    }
  }
}
