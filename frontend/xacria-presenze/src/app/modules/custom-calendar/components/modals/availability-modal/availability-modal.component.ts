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
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modalComponent';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { faIcons } from '../../custom-calendar-page/custom-calendar-page.component';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import {
  CalendarAvailabilityEntry,
  CalendarEntity,
} from 'src/generated-client';
import { identifiableCalendarAvailability } from 'src/app/modules/custom-calendar/models/calendar';
import { projects } from '../../../const-vars';
import { CalendarStateService } from '../../../services/calendar-state.service';
import { ToastrService } from 'ngx-toastr';

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
  @Input() currentDate?: Date;
  closeResult = '';
  form!: FormGroup;
  faIcons = faIcons;
  toDeleteEntries: string[] = [];
  @ViewChildren('entry') entryElements!: QueryList<ElementRef>;
  initialCalendarentries: identifiableCalendarAvailability[] = [];
  apiError: string | null = null;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private renderer: Renderer2,
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
    if (!this.isModifyMode) {
      const formattedCurrentDate = this.dateFormat.manuallyFormatToDateInput(
        this.currentDate ?? new Date()
      );
      this.form = this.fb.group({
        dateFrom: [formattedCurrentDate, Validators.required],
        dateTo: [formattedCurrentDate, Validators.required],
        project: [this.validProjects[0], Validators.required],
      });
    } else this.initializeModifyForm();
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
      dateFrom: [from, Validators.required],
      dateTo: [to, Validators.required],
      project: [
        !entry.calendarEntry.project
          ? this.validProjects[0]
          : entry.calendarEntry.project,
        Validators.required,
      ],
    });
  }

  private updateEntries(): void {
    const currentEntries: ({ id: string } & CalendarAvailabilityEntry)[] =
      this.availabilities.value;
    const changedEntries: identifiableCalendarAvailability[] = currentEntries
      .filter((entry: { id: string } & CalendarAvailabilityEntry, i) => {
        const initial = this.initialCalendarentries[i];
        return JSON.stringify(entry) !== JSON.stringify(initial);
      })
      .map((entry: { id: string } & CalendarAvailabilityEntry) => {
        return {
          id: entry.id,
          calendarEntry: {
            dateFrom: entry.dateFrom,
            dateTo: entry.dateTo,
            project: entry.project,
          },
        };
      });
    console.log('To updated entries', changedEntries);
    this.calendarStateService
      .updateCalendarEntries(changedEntries, 'AVAILABILITY')
      .subscribe((resp: boolean) => {
        if (!resp)
          this.toastrService.error(
            this.apiError ?? 'Errore nella modifica delle disponibilità.'
          );
        else {
          this.toastrService.clear();
          this.toastrService.success('Disponibilità modificate con successo');
        }
      });
    this.initialCalendarentries = this.availabilities.value;
  }

  private deleteEntries(): void {
    if (this.toDeleteEntries.length) {
      this.calendarStateService
        .deleteCalendarEntities(this.toDeleteEntries, 'AVAILABILITY')
        .subscribe((resp: boolean) => {
          if (!resp)
            this.toastrService.error(
              this.apiError ?? 'Errore nella cancellazione delle disponibilità.'
            );
          else {
            this.toastrService.clear();
            this.toastrService.success('Disponibilità cancellate con successo');
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
      this.initialCalendarentries = this.availabilities.value;
      //console.log('INITIAL', this.initialCalendarentries);
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

  private emptyToDeleteEntries(): void {
    this.toDeleteEntries = [];
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
      this.calendarStateService
        .saveCalendarEntry(newEntry, 'AVAILABILITY')
        .subscribe((resp: boolean) => {
          if (!resp)
            this.toastrService.error(
              this.apiError ?? 'Errore nella creazione della reperibiillità'
            );
          else this.toastrService.success('Reperibilità creata con successo');
        });
      this.form.reset();
    } else console.error('Availability new entry form is invalid');
  }
}

//COSA FARE: cambia i tipi da any a quelli corretti
