import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { projects } from '../../const-vars';
import { ModalComponent } from '../modalComponent';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { faIcons } from '../../attendance/attendance.component';
import { CalendarDayWorkEntry } from 'src/app/layout/interfaces';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { CalendarWorkingDayEntry } from 'src/generated-client';
import { identifiableCalendarWorkingDay } from 'src/app/layout/shared/models/calendar';

@Component({
  selector: 'app-daywork-modal',
  templateUrl: './daywork-modal.component.html',
  styleUrls: ['./daywork-modal.component.scss'],
})
export class DayworkModalComponent
  implements ModalComponent, OnChanges, OnInit
{
  form!: FormGroup;
  validProjects: string[] = projects;
  @ViewChild('modal', { static: true }) modalElement!: ElementRef;
  @Input() date!: Date;
  @Input() dateString!: string;
  @Input() isModifyMode!: boolean;
  @Input() calendarEntries!: identifiableCalendarWorkingDay[];
  closeResult = '';
  faIcons: any = faIcons;
  toDeleteEntries: identifiableCalendarWorkingDay[] = [];
  @Output() saveDayWorks = new EventEmitter<CalendarWorkingDayEntry[]>();

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateFormat: DateFormatService
  ) {}

  get hourFrom() {
    return this.form.get('hour_from');
  }
  get hourTo() {
    return this.form.get('hour_to');
  }
  get project() {
    return this.form.get('project');
  }
  get dayWorks() {
    return this.form.get('day_works') as FormArray;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    if (!this.isModifyMode)
      this.form = this.fb.group({
        hour_from: [null, Validators.required],
        hour_to: [null, Validators.required],
        project: [this.validProjects[0], Validators.required],
        day_works: this.fb.array([]),
      });
    else this.initializeModifyForm();
  }

  initializeModifyForm() {
    let entries: FormGroup[] = [];
    this.calendarEntries.forEach((entry: identifiableCalendarWorkingDay) => {
      entries.push(this.createNewDayWork(entry));
    });
    this.form = this.fb.group({
      day_works: this.fb.array(entries),
    });
  }

  //Aggiunge un nuovo formGroup per la selezione di un nuovo lavoro nel form daywork.
  createNewDayWork(entry?: identifiableCalendarWorkingDay): FormGroup {
    let group: FormGroup;
    if (!entry)
      group = this.fb.group({
        hour_from: [null, Validators.required],
        hour_to: [null, Validators.required],
        project: [this.validProjects[0], Validators.required],
      });
    else {
      group = this.fb.group({
        id: [entry.id],
        hour_from: [entry.calendarEntry.hourFrom, Validators.required],
        hour_to: [entry.calendarEntry.hourTo, Validators.required],
        project: [entry.calendarEntry.project, Validators.required],
      });
    }
    return group;
  }

  addNewDayWork() {
    this.dayWorks.push(this.createNewDayWork());
  }

  removeDayWork(i: number): void {
    this.dayWorks.removeAt(i);
  }

  //necessario per cambiare correttamente la data di inizio. Dato che inizialmente è impostata come quella attuale quando la modale è chiusa.
  ngOnChanges(changes: SimpleChanges): void {
    /* this.hourFrom?.setValue(this.parseDate(this.date)); */
  }

  private parseDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mesi da 0 a 11
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; //si è risolto per metà
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

  toggleEntryDelete(entry: identifiableCalendarWorkingDay, i: number) {
    console.log('CONTROLLA IL VALORE', entry, i);
    if (this.toDeleteEntries.includes(entry)) {
      this.toDeleteEntries = this.toDeleteEntries.filter(
        (value: identifiableCalendarWorkingDay) => value !== entry
      );
    } else {
      this.toDeleteEntries.push(entry);
    }
  }

  submitNewEntries(): void {
      if(this.form.valid){
        console.log("check date:", this.dateFormat.normalizeDate(this.date));
        const normalizedDate = this.dateFormat.normalizeDate(this.date);
        const newDayWorkEntries: CalendarWorkingDayEntry[] = this.dayWorks.value.map(
          (entry: CalendarDayWorkEntry) => {
            return {
              project: entry.project,
              hourFrom: entry.hour_from,
              hourTo: entry.hour_to,
              dateFrom: normalizedDate
            };
          }
        );
        //To push the first entry which not from the form array
        newDayWorkEntries.push(
          {
            project: this.project?.value,
            hourFrom: this.hourFrom?.value,
            hourTo: this.hourTo?.value,
            dateFrom: normalizedDate
          }
        );
        this.saveDayWorks.emit(newDayWorkEntries);
      }
      else console.error('Availability new entry form is invalid');
    }
}
