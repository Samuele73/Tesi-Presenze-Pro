import { Component, ElementRef, Input, OnInit, QueryList, Renderer2, SimpleChanges, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { projects } from '../../const-vars';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modalComponent';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { faIcons } from '../../attendance/attendance.component';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { CalendarAvailabilityEntry } from 'src/generated-client';

@Component({
  selector: 'app-availability-modal',
  templateUrl: './availability-modal.component.html',
  styleUrls: ['./availability-modal.component.scss']
})
export class AvailabilityModalComponent implements ModalComponent, OnInit{
  validProjects: any = projects;
  @ViewChild("modal", {static: true}) modalElement!: TemplateRef<any>;
  @Input() calendarEntries!: CalendarAvailabilityEntry[];
  @Input() isModifyMode!: boolean;
  closeResult = '';
  form!: FormGroup;
  faIcons = faIcons;
  toDeleteEntries: CalendarAvailabilityEntry[] = [];
  @ViewChildren("entry") entryElements!: QueryList<ElementRef>;

  constructor(private modalService: NgbModal, private fb: FormBuilder, private renderer: Renderer2, private dateFormat: DateFormatService) {

  }

  get dateFrom(){return this.form.get("date_from");}
  get dateTo(){return this.form.get("date_to");}
  get project(){return this.form.get("project");}
  get availabilities(){return this.form.get("availabilities") as FormArray;}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void{
    if(!this.isModifyMode)
      this.form = this.fb.group({
        date_from: [null, Validators.required],
        date_to: [null, Validators.required],
        project: [this.validProjects[0], Validators.required]
      })
    else
      this.initializeModifyForm();
  }

  initializeModifyForm(){
    let entries: any[] = [];
    this.calendarEntries.forEach((entry) => {
      entries.push(this.createAvailabilityGroup(entry))
    })
    this.form = this.fb.group({
      availabilities: this.fb.array(entries)
    })
  }

  createAvailabilityGroup(entry: CalendarAvailabilityEntry){
    const from = this.dateFormat.formatToDateInput(entry.dateFrom ?? new Date());
    const to = this.dateFormat.formatToDateInput(entry.dateTo ?? new Date());
    return this.fb.group({
      date_from: [from, Validators.required],
      date_to: [to, Validators.required],
      project: [!entry.project ? this.validProjects[0] : "", Validators.required]
    })
  }

  submitForm(): void{
    if(this.form.valid)
      console.log(this.form.value);
    else
      console.error("Form invalido");
  }

  open(): void{
    if(!this.calendarEntries.length)
        return;
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

  //Da implementare con il server
  toggleEntryDelete(entry: CalendarAvailabilityEntry, i: number): void{
    console.log("CONTROLLA IL VALORE", entry, i);
    if (this.toDeleteEntries.includes(entry)) {
      this.toDeleteEntries = this.toDeleteEntries.filter((value: CalendarAvailabilityEntry) => value !== entry);
    } else {
      this.toDeleteEntries.push(entry);
    }
  }
}


//COSA FARE: cambia i tipi da any a quelli corretti
