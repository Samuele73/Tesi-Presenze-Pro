import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modalComponent';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { faIcons } from '../../custom-calendar-page/custom-calendar-page.component';
import { CalendarRequestEntry } from 'src/generated-client';
import { identifiableCalendarRequest } from 'src/app/modules/custom-calendar/models/calendar';
import { request_types } from '../../../const-vars';
import { CalendarStateService } from '../../../services/calendar-state.service';
import { ToastrService } from 'ngx-toastr';
import { dateRangeValidator } from '../../../validators/dateRange.validators';
import { timeRangeValidator } from '../../../validators/timeRange.validators';

type reqeustsFormType = {
  id: string;
  dateFrom: string;
  dateTo: string;
  timeFrom: string;
  timeTo: string;
  requestsType: string;
  status: string;
};

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
  @Input() currentDate?: Date;
  faIcons = faIcons;
  toDeleteEntries: string[] = [];
  initialRequests: identifiableCalendarRequest[] = [];
  apiError: string | null = null;
  statusLabelMap: { [key: string]: string } = {
    PENDING: 'IN ATTESA',
    ACCEPTED: 'ACCETTATA',
    REJECTED: 'RIFIUTATA',
  };
  statusClassMap: { [key: string]: string } = {
    PENDING: 'bg-warning',
    ACCEPTED: 'bg-primary',
    REJECTED: 'bg-danger',
  };
  todayString = new Date().toISOString().split('T')[0];

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private dateFormat: DateFormatService,
    private calendarStateService: CalendarStateService,
    private toastrService: ToastrService
  ) {}

  get requestType() {
    return this.form.get('requestType');
  }
  get dateFrom() {
    return this.form.get('dateFrom');
  }
  get dateTo() {
    return this.form.get('dateTo');
  }
  get timeFrom() {
    return this.form.get('timeFrom');
  }
  get timeTo() {
    return this.form.get('timeTo');
  }
  get requests() {
    return this.form.get('requests') as FormArray;
  }

  activePanels: Set<number> = new Set();

  togglePanel(i: number) {
    if (this.activePanels.has(i)) {
      this.activePanels.delete(i);
    } else {
      this.activePanels.add(i);
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.calendarStateService.error.subscribe((error: string | null) => {
      if (error) this.apiError = error;
    });
  }

  initializeForm(): void {
    if (!this.isModifyMode) {
      const formattedCurrentDate = this.dateFormat.manuallyFormatToDateInput(
        this.currentDate ?? new Date()
      );
      const defaultTime: string = '09:00';
      this.form = this.fb.group(
        {
          requestType: [request_types[0], Validators.required],
          dateFrom: [formattedCurrentDate, Validators.required],
          dateTo: [formattedCurrentDate, Validators.required],
          timeFrom: [defaultTime, Validators.required],
          timeTo: [defaultTime, Validators.required],
        },
        {
          validators: [
            dateRangeValidator('dateFrom', 'dateTo'),
            timeRangeValidator('timeFrom', 'timeTo'),
          ],
        }
      );
    } else {
      this.initializeModifyForm();
    }
  }

  private disableClosedRequests(): void {
    if (this.isModifyMode) {
      this.requests.controls.forEach((group, i) => {
        const status = group.get('status')?.value;

        if (this.isRequestModifyForbidden(status)) {
          group.disable({ emitEvent: false });
        } else {
          group.enable({ emitEvent: false });
        }
      });
    }
  }

  private emptyToDeleteEntries(): void {
    this.toDeleteEntries = [];
  }

  private updateEntries(): void {
    const currentEntries: ({ id: string } & CalendarRequestEntry)[] =
      this.requests.value;
    const changedEntries: identifiableCalendarRequest[] = currentEntries
      .filter((entry: { id: string } & CalendarRequestEntry, i) => {
        const initial = this.initialRequests[i];
        console.log(
          'todelete entries',
          this.toDeleteEntries,
          !this.toDeleteEntries.includes(entry.id),
          entry.id
        );

        return (
          JSON.stringify(entry) !== JSON.stringify(initial) &&
          !this.toDeleteEntries.includes(entry.id)
        );
      })
      .map((entry: { id: string } & CalendarRequestEntry) => {
        return {
          id: entry.id,
          calendarEntry: {
            dateFrom: entry.dateFrom,
            dateTo: entry.dateTo,
            timeFrom: entry.timeFrom,
            timeTo: entry.timeTo,
            requestType: entry.requestType,
          },
        };
      });
    console.log('To updated entries', changedEntries);
    this.calendarStateService
      .updateCalendarEntries(changedEntries, 'REQUEST')
      .subscribe((resp: boolean) => {
        if (resp) {
          this.toastrService.clear();
          this.toastrService.success('Richiesta modificata con successo');
        }
      });
    this.initialRequests = this.requests.value;
  }

  private deleteEntries(): void {
    console.log(
      'to delete entries lenght',
      this.toDeleteEntries.length,
      this.toDeleteEntries
    );
    if (this.toDeleteEntries.length) {
      console.log('i am about to delete', this.toDeleteEntries);
      this.calendarStateService
        .deleteCalendarEntities(this.toDeleteEntries, 'REQUEST')
        .subscribe((resp: boolean) => {
          if (resp) {
            this.toastrService.clear();
            this.toastrService.success('Richiesta cancellata con successo');
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
    console.log('check here', this.form, this.toDeleteEntries);

    /* Importante l ordine */
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

  initializeModifyForm(): void {
    let entries: FormGroup[] = [];
    this.calendarEntries.forEach((entry: identifiableCalendarRequest) => {
      entries.push(this.createRequestGroup(entry));
    });
    this.form = this.fb.group({
      requests: this.fb.array(entries),
    });
    this.disableClosedRequests();
  }

  createRequestGroup(entry: identifiableCalendarRequest) {
    const from = this.dateFormat.formatToDateInput(
      entry.calendarEntry.dateFrom ?? new Date()
    );
    const to = this.dateFormat.formatToDateInput(
      entry.calendarEntry.dateTo ?? new Date()
    );
    return this.fb.group(
      {
        id: [entry.id],
        dateFrom: [from, Validators.required],
        dateTo: [to, Validators.required],
        timeFrom: [entry.calendarEntry.timeFrom, Validators.required],
        timeTo: [entry.calendarEntry.timeTo, Validators.required],
        requestType: [entry.calendarEntry.requestType, Validators.required],
        status: [entry.calendarEntry.status, Validators.required],
      },
      {
        validators: [
          dateRangeValidator('dateFrom', 'dateTo'),
          timeRangeValidator('timeFrom', 'timeTo'),
        ],
      }
    );
  }

  isRequestModifyForbidden(reqeustStatus: CalendarRequestEntry.StatusEnum) {
    return reqeustStatus === 'ACCEPTED' || reqeustStatus === 'REJECTED';
  }

  toggleEntryDelete(entry: reqeustsFormType, i: number): void {
    if (
      this.isRequestModifyForbidden(
        entry.status as CalendarRequestEntry.StatusEnum
      )
    )
      return;
    const entryId = entry.id;
    console.log('CONTROLLA IL VALORE ava', entryId, i);
    if (this.toDeleteEntries.includes(entryId)) {
      this.toDeleteEntries = this.toDeleteEntries.filter(
        (value: string) => value !== entryId
      );
    } else {
      this.toDeleteEntries.push(entryId);
    }
    console.log('status to delete entries:', this.toDeleteEntries);
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
      this.calendarStateService
        .saveCalendarEntry(newEntry, 'REQUEST')
        .subscribe((resp: boolean) => {
          if (resp) this.toastrService.success('Richiesta creata con successo');
        });
      this.form.reset();
    } else console.error('Availability new entry form is invalid');
  }

  showTimeBasedOnRequestType(requestType: AbstractControl | null): boolean {
    return requestType?.value !== 'Ferie' && requestType?.value !== 'Congedo';
  }
}
