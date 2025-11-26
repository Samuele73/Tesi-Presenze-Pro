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
import { ModalComponent } from '../modalComponent';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { faIcons } from '../../custom-calendar-page/custom-calendar-page.component';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import {
  CalendarWorkingDayEntry,
  Project,
  ProjectService,
} from 'src/generated-client';
import { identifiableCalendarWorkingDay } from 'src/app/modules/custom-calendar/models/calendar';
import { parse } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { CalendarStateService } from '../../../services/calendar-state.service';
import { ToastrService } from 'ngx-toastr';
import { ProjectStoreService } from 'src/app/modules/project/services/project-store.service';
import { timeRangeValidator } from '../../../validators/timeRange.validators';

@Component({
  selector: 'app-daywork-modal',
  templateUrl: './daywork-modal.component.html',
  styleUrls: ['./daywork-modal.component.scss'],
})
export class DayworkModalComponent
  implements ModalComponent, OnChanges, OnInit
{
  form!: FormGroup;
  validProjects: string[] = [];
  @ViewChild('modal', { static: true }) modalElement!: ElementRef;
  @Input() date!: Date;
  @Input() dateString!: string;
  @Input() isModifyMode!: boolean;
  @Input() calendarEntries!: identifiableCalendarWorkingDay[];
  closeResult = '';
  faIcons: any = faIcons;
  toDeleteEntries: string[] = [];
  initialWorkingDays: ({ id: string } & CalendarWorkingDayEntry)[] = [];
  apiError: string | null = null;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dateFormat: DateFormatService,
    private calendarStateService: CalendarStateService,
    private projectService: ProjectService,
    private toastrService: ToastrService,
    private projectStoreService: ProjectStoreService
  ) {}

  get hourFrom() {
    return this.form.get('hourFrom');
  }
  get hourTo() {
    return this.form.get('hourTo');
  }
  get project() {
    return this.form.get('project');
  }
  get dayWorks() {
    return this.form.get('day_works') as FormArray;
  }

  ngOnInit(): void {
    this.syncUserProjects();
    this.initializeForm();
  }

  syncUserProjects(): void {
    this.projectStoreService.userProjectsName$.subscribe((names: string[]) => {
      this.validProjects = names;
    });
  }

  initializeForm(): void {
    if (!this.isModifyMode)
      this.form = this.fb.group(
        {
          hourFrom: [null, Validators.required],
          hourTo: [null, Validators.required],
          project: [this.validProjects[0], Validators.required],
          day_works: this.fb.array([]),
        },
        {
          validators: timeRangeValidator('hourFrom', 'hourTo'),
        }
      );
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
    this.initialWorkingDays = this.dayWorks.getRawValue();
    this.emptyToDeleteEntries();
  }

  private emptyToDeleteEntries(): void {
    this.toDeleteEntries = [];
  }

  //Aggiunge un nuovo formGroup per la selezione di un nuovo lavoro nel form daywork.
  createNewDayWork(entry?: identifiableCalendarWorkingDay): FormGroup {
    let group: FormGroup;
    if (!entry)
      group = this.fb.group(
        {
          hourFrom: [null, Validators.required],
          hourTo: [null, Validators.required],
          project: [this.validProjects[0], Validators.required],
        },
        { validators: timeRangeValidator('hourFrom', 'hourTo') }
      );
    else {
      group = this.fb.group(
        {
          id: [entry.id],
          hourFrom: [entry.calendarEntry.hourFrom, Validators.required],
          hourTo: [entry.calendarEntry.hourTo, Validators.required],
          project: [entry.calendarEntry.project, Validators.required],
        },
        { validators: timeRangeValidator('hourFrom', 'hourTo') }
      );
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

  private deleteEntries(): void {
    if (this.toDeleteEntries.length) {
      console.log('To delete entries', this.toDeleteEntries);
      this.calendarStateService
        .deleteCalendarEntities(this.toDeleteEntries, 'WORKING_DAY')
        .subscribe((resp: boolean) => {
          if (resp){
            this.toastrService.clear();
            this.toastrService.success(
              'Lavori giornalieri cancellati con successo'
            );
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

  toggleEntryDelete(entry: identifiableCalendarWorkingDay, i: number): void {
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

  private updateEntries(): boolean {
    const currentEntries: ({ id: string } & CalendarWorkingDayEntry)[] =
      this.dayWorks.getRawValue();
    const changedEntries: identifiableCalendarWorkingDay[] = currentEntries
      .filter((entry: { id: string } & CalendarWorkingDayEntry, i) => {
        const initial = this.initialWorkingDays[i];
        return (
          JSON.stringify(entry) !== JSON.stringify(initial) &&
          !this.toDeleteEntries.includes(entry.id)
        );
      })
      .map((entry: { id: string } & CalendarWorkingDayEntry) => {
        return {
          id: entry.id,
          calendarEntry: {
            dateFrom: this.parseItalianDate(this.dateString),
            hourFrom: entry.hourFrom,
            hourTo: entry.hourTo,
            project: entry.project,
          },
        };
      });
    console.log('la data', this.parseItalianDate(this.dateString));
    console.log('To updated entries', changedEntries);
    if (!changedEntries.length) return false;
    this.calendarStateService
      .updateCalendarEntries(changedEntries, 'WORKING_DAY')
      .subscribe((resp: boolean) => {
        if (resp) {
          this.toastrService.clear();
          this.toastrService.success(
            'Lavori giornalieri modificati con successo'
          );
        }
      });
    this.initialWorkingDays = this.dayWorks.getRawValue();
    return true;
  }

  parseItalianDate(input: string): Date {
    // Rimuovo la parte del giorno della settimana
    const cleaned = input.split('-')[0].trim();

    // Parsing in formato "26 Agosto 2025"
    return parse(cleaned, 'd MMMM yyyy', new Date(), { locale: itLocale });
  }

  submitNewEntries(): void {
    if (this.form.valid) {
      console.log('check date:', this.dateFormat.normalizeDate(this.date));
      const normalizedDate = this.dateFormat.normalizeDate(this.date);
      const newDayWorkEntries: CalendarWorkingDayEntry[] =
        this.dayWorks.value.map((entry: CalendarWorkingDayEntry) => {
          return {
            project: entry.project,
            hourFrom: entry.hourFrom,
            hourTo: entry.hourFrom,
            dateFrom: normalizedDate,
          };
        });
      //To push the first entry which not from the form array
      newDayWorkEntries.push({
        project: this.project?.value,
        hourFrom: this.hourFrom?.value,
        hourTo: this.hourTo?.value,
        dateFrom: normalizedDate,
      });
      this.calendarStateService
        .saveCalendarEntities(newDayWorkEntries, 'WORKING_DAY')
        .subscribe((resp: boolean) => {
          if (resp)
            this.toastrService.success(
              'Lavoro giornaliero creato con successo'
            );
        });
    } else console.error('Availability new entry form is invalid');
  }
}
