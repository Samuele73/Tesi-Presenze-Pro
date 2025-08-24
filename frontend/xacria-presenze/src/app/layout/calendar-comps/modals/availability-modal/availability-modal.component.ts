import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { projects } from '../../const-vars';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modalComponent';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { faIcons } from '../../attendance/attendance.component';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { CalendarAvailabilityEntry } from 'src/generated-client';
import { identifiableCalendarAvailability } from 'src/app/layout/shared/models/calendar';

@Component({
  selector: 'app-availability-modal',
  templateUrl: './availability-modal.component.html',
  styleUrls: ['./availability-modal.component.scss'],
})
export class AvailabilityModalComponent implements ModalComponent, OnInit {
  validProjects: any = projects;
  @ViewChild('modal', { static: true }) modalElement!: TemplateRef<any>;
  @Input() calendarEntries!: identifiableCalendarAvailability[];
  @Input() isModifyMode!: boolean;
  closeResult = '';
  form!: FormGroup;
  faIcons = faIcons;
  toDeleteEntries: string[] = [];
  @ViewChildren('entry') entryElements!: QueryList<ElementRef>;
  @Output() saveAvailability = new EventEmitter<CalendarAvailabilityEntry>();
  @Output() deleteAvailabilies = new EventEmitter<string[]>();

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private renderer: Renderer2,
    private dateFormat: DateFormatService
  ) {}

  get dateFrom() {
    return this.form.get('date_from');
  }
  get dateTo() {
    return this.form.get('date_to');
  }
  get project() {
    return this.form.get('project');
  }
  get availabilities() {
    return this.form.get('availabilities') as FormArray;
  }

  ngOnInit(): void {
    /* this.initializeForm(); */
  }

  initializeForm(): void {
    if (!this.isModifyMode)
      this.form = this.fb.group({
        date_from: [null, Validators.required],
        date_to: [null, Validators.required],
        project: [this.validProjects[0], Validators.required],
      });
    else this.initializeModifyForm();
  }

  //potrebbe essere utile in caso di feature di notifica
  /* ngOnChanges(changes: SimpleChanges): void {
    if (changes['calendarEntries'] && this.isModifyMode) {
      console.log('Modifica delle entries di disponibilità');
      this.initializeModifyForm();
    }
  } */

  initializeModifyForm() {
    let entries: FormGroup[] = [];
    this.calendarEntries.forEach((entry) => {
      entries.push(this.createAvailabilityGroup(entry));
    });
    this.form = this.fb.group({
      availabilities: this.fb.array(entries),
    });
  }

  createAvailabilityGroup(entry: identifiableCalendarAvailability) {
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
      project: [
        !entry.calendarEntry.project
          ? this.validProjects[0]
          : entry.calendarEntry.project,
        Validators.required,
      ],
    });
  }

  submitModifyModeForm(): void {
    if (!this.form.valid) {
      console.error('Availability modify form is invalid');
      return;
    }
    if (this.toDeleteEntries.length) {
      this.deleteAvailabilies.emit(this.toDeleteEntries);
      this.toDeleteEntries = [];
    }
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

  //Da implementare con il server
  toggleEntryDelete(entry: identifiableCalendarAvailability, i: number): void {
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
      const newEntry: CalendarAvailabilityEntry = {
        dateFrom: this.dateFrom?.value,
        dateTo: this.dateTo?.value,
        project: this.project?.value,
      };
      this.saveAvailability.emit(newEntry);
      this.form.reset();
    } else console.error('Availability new entry form is invalid');
  }
}

//COSA FARE: cambia i tipi da any a quelli corretti
