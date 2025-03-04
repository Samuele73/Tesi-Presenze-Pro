import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { projects } from '../../const-vars';
import { ModalComponent } from '../modalComponent';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { faIcons } from '../../attendance/attendance.component';
import { CalendarDayWorkEntry } from 'src/app/layout/interfaces';
import { DateFormatService } from 'src/app/shared/services/date-format.service';

@Component({
  selector: 'app-daywork-modal',
  templateUrl: './daywork-modal.component.html',
  styleUrls: ['./daywork-modal.component.scss']
})
export class DayworkModalComponent implements ModalComponent, OnChanges, OnInit {
  form!: FormGroup;
  validProjects: string[] = projects;
  @ViewChild("modal", {static: true}) modalElement!: ElementRef;
  @Input() date!: Date;
  @Input() dateString!: string;
  @Input() isModifyMode!: boolean;
  @Input() calendarEntries!: CalendarDayWorkEntry[];
  closeResult = '';
  faIcons: any = faIcons;
  toDeleteEntries: CalendarDayWorkEntry[] = [];

  constructor(private modalService: NgbModal, private fb: FormBuilder, private cdr: ChangeDetectorRef, private dateFormat: DateFormatService){

  }

  get hourFrom(){return this.form.get("hour_from");}
  get hourTo(){return this.form.get("hour_to");}
  get project(){return this.form.get("project");}
  get dayWorks(){return this.form.get("day_works") as FormArray;}

  ngOnInit(): void {
      this.initializeForm();
  }

  initializeForm(): void{
    if(!this.isModifyMode)
      this.form = this.fb.group({
        hour_from: [null, Validators.required],
        hour_to: [null, Validators.required],
        project: [this.validProjects[0], Validators.required],
        day_works: this.fb.array([])
      })
    else
      this.initializeModifyForm();
  }

  initializeModifyForm(){
    let entries: any[] = [];
    this.calendarEntries.forEach((entry: CalendarDayWorkEntry) => {
      entries.push(this.createNewDayWork(entry));
    })
    this.form = this.fb.group({
      day_works: this.fb.array(entries)
    });
  }

  //Aggiunge un nuovo formGroup per la selezione di un nuovo lavoro nel form daywork.
  createNewDayWork(entry?: CalendarDayWorkEntry){
    let group: FormGroup;
    if(!entry)
      group = this.fb.group({
        hour_from: [null, Validators.required],
        hour_to: [null, Validators.required],
        project: [this.validProjects[0], Validators.required]
      });
    else{
      group = this.fb.group({
        hour_from: [entry.hour_from, Validators.required],
        hour_to: [entry.hour_to, Validators.required],
        project: [entry.project, Validators.required]
      })
    }
    return group;
  }

  addNewDayWork(){
    this.dayWorks.push(this.createNewDayWork());
  }

  removeDayWork(i: number): void{
    this.dayWorks.removeAt(i);
  }

  //necessario per cambiare correttamente la data di inizio. Dato che inizialmente è impostata come quella attuale quando la modale è chiusa.
  ngOnChanges(changes: SimpleChanges): void {
    /* this.hourFrom?.setValue(this.parseDate(this.date)); */
  }

  private parseDate(date: Date): string{
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mesi da 0 a 11
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; //si è risolto per metà
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
        this.dayWorks.clear();
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
        this.toDeleteEntries = this.toDeleteEntries.filter((value: CalendarDayWorkEntry) => value !== entry);
      } else {
        this.toDeleteEntries.push(entry);
      }
    }
}
