import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { request_types } from '../../const-vars';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modalComponent';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { CalendarRequestEntry } from 'src/app/layout/interfaces';
import { faIcons } from '../../attendance/attendance.component';

@Component({
  selector: 'app-request-modal',
  templateUrl: './request-modal.component.html',
  styleUrls: ['./request-modal.component.scss']
})
export class RequestModalComponent implements ModalComponent, OnInit{
  request_types: any = request_types;
  @ViewChild("modal", {static: true}) modalElement!: ElementRef;
  closeResult = '';
  form!: FormGroup;
  @Input() isModifyMode!: boolean;
  @Input() calendarEntries!: CalendarRequestEntry[];
  faIcons = faIcons;
  toDeleteEntries: CalendarRequestEntry[] = [];

  constructor(private modalService: NgbModal, private fb: FormBuilder, private dateFormat: DateFormatService) {

  }

  get requestType(){return this.form.get("request_type");}
  get dateFrom(){return this.form.get("date_from");}
  get dateTo(){return this.form.get("date_to");}
  get timeFrom(){return this.form.get("time_from");}
  get timeTo(){return this.form.get("time_to");}
  get requests(){return this.form.get("requests") as FormArray;}

  ngOnInit(): void {
      this.initializeForm();
  }

  initializeForm(): void{
    if(!this.isModifyMode)
      this.form = this.fb.group({
        request_type: [null, Validators.required],
        date_from: [null, Validators.required],
        date_to: [null, Validators.required],
        time_from: [null, Validators.required],
        time_to: [null, Validators.required]
      })
    else
      this.initializeModifyForm();
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

  initializeModifyForm(): void{
    let entries: any[] = [];
    this.calendarEntries.forEach((entry) => {
      entries.push(this.createRequestGroup(entry))
    })
    this.form = this.fb.group({
      requests: this.fb.array(entries)
    })
  }

  createRequestGroup(entry: CalendarRequestEntry){
    const from = this.dateFormat.formatToDateInput(entry.date_from);
    const to = this.dateFormat.formatToDateInput(entry.date_to);
    return this.fb.group({
      date_from: [from, Validators.required],
      date_to: [to, Validators.required],
      time_from: [entry.time_from, Validators.required],
      time_to: [entry.time_to, Validators.required],
      request_type: [entry.request_type, Validators.required]
    })
  }

  toggleEntryDelete(entry: CalendarRequestEntry, i: number){
    console.log("CONTROLLA IL VALORE", entry, i);
    if (this.toDeleteEntries.includes(entry)) {
      this.toDeleteEntries = this.toDeleteEntries.filter((value: CalendarRequestEntry) => value !== entry);
    } else {
      this.toDeleteEntries.push(entry);
    }
  }
}
