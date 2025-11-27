import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Modal } from 'bootstrap';
import { NgForm } from '@angular/forms';
import { CalendarService } from 'src/generated-client';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastI18nService } from 'src/app/shared/services/toast-i18n.service';

@Component({
  selector: 'app-calendar-csv-modal',
  templateUrl: './calendar-csv-modal.component.html',
  styleUrls: ['./calendar-csv-modal.component.scss'],
})
export class CalendarCsvModalComponent {
  @ViewChild('addProjectModal', { static: true })
  modalElement!: TemplateRef<Modal>;
  @Input() calendarSelectedDate?: Date;
  availableMonths: { value: number; label: string }[] = [];
  selectedMonth: number | null = null;
  private readonly locale =
    typeof navigator !== 'undefined' && navigator.language
      ? navigator.language
      : 'it-IT';
  todayYear: number = new Date().getFullYear();

  constructor(
    private modalService: NgbModal,
    private calendarService: CalendarService,
    private toast: ToastI18nService
  ) {}

  initializeForm(): void {
    const today = new Date();
    const selectedDateYear = this.calendarSelectedDate?.getFullYear();
    const isPreviousYearSelection =
      selectedDateYear === today.getFullYear() - 1;
    const referenceYear = isPreviousYearSelection
      ? selectedDateYear!
      : today.getFullYear();
    const startMonthIndex = isPreviousYearSelection ? 11 : today.getMonth();
    const monthsCount = startMonthIndex + 1;

    this.todayYear = referenceYear;
    this.availableMonths = Array.from({ length: monthsCount }, (_, idx) => {
      const monthIndex = idx;
      return {
        value: monthIndex,
        label: new Date(referenceYear, monthIndex, 1).toLocaleString(
          this.locale,
          {
            month: 'long',
          }
        ),
      };
    });
    if (!this.availableMonths.length) {
      this.selectedMonth = null;
      return;
    }
    const initialMonth = this.calendarSelectedDate
      ? this.calendarSelectedDate.getMonth()
      : startMonthIndex;
    const limitedInitialMonth = Math.min(initialMonth, startMonthIndex);
    const matchedMonth = this.availableMonths.find(
      (month) => month.value === limitedInitialMonth
    );
    this.selectedMonth = matchedMonth
      ? matchedMonth.value
      : this.availableMonths[0].value;
  }

  private getReferenceYear() {
    const today = new Date();
    const selectedDateYear = this.calendarSelectedDate?.getFullYear();
    const isPreviousYearSelection =
      selectedDateYear === today.getFullYear() - 1;
    return isPreviousYearSelection ? selectedDateYear! : today.getFullYear();
  }

  open(): void {
    this.initializeForm();
    this.modalService
      .open(this.modalElement, {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'calendar-report-modal',
      })
      .result.then(
        (result) => {},
        (reason) => {
          //forse initialize form
        }
      );
  }

  submitReportExport(form?: NgForm): void {
    const referenceYear = this.getReferenceYear();
    const currentDate = new Date();
    if (
      form &&
      (form.invalid ||
        this.selectedMonth === null ||
        this.calendarSelectedDate!.getFullYear() === null ||
        currentDate.getMonth() < this.selectedMonth)
    ) {
      form.control.markAllAsTouched();
      return;
    }

    this.calendarService
      .exportMonthFromCurrentYear(this.selectedMonth!, referenceYear)
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const monthLabel =
            this.availableMonths.find((m) => m.value === this.selectedMonth)
              ?.label || 'report';
          a.download = `report_${monthLabel}_${this.todayYear}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          setTimeout(() => {
            this.modalService.dismissAll();
          }, 300);
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 404) {
            this.toast.error(
              'Nessun dato disponibile per il mese selezionato.',
              'Download fallito'
            );
          } else
            this.toast.error(
              'Si è verificato un errore durante il download del report.',
              'Download fallito'
            );
          this.modalService.dismissAll();
        },
      });
  }
}
