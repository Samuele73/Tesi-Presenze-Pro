import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Modal } from 'bootstrap';
import { NgForm } from '@angular/forms';
import { CalendarService } from 'src/generated-client';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

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
    private toastrService: ToastrService
  ) {}

  initializeForm(): void {
    const today = new Date();
    const currentMonthIndex = today.getMonth();
    this.availableMonths = Array.from(
      { length: currentMonthIndex + 1 },
      (_, idx) => {
        const monthIndex = currentMonthIndex - idx;
        return {
          value: monthIndex,
          label: new Date(today.getFullYear(), monthIndex, 1).toLocaleString(
            this.locale,
            {
              month: 'long',
            }
          ),
        };
      }
    );
    if (!this.availableMonths.length) {
      this.selectedMonth = null;
      return;
    }
    const initialMonth = this.calendarSelectedDate
      ? this.calendarSelectedDate.getMonth()
      : currentMonthIndex;
    const limitedInitialMonth = Math.min(initialMonth, currentMonthIndex);
    const matchedMonth = this.availableMonths.find(
      (month) => month.value === limitedInitialMonth
    );
    this.selectedMonth = matchedMonth
      ? matchedMonth.value
      : this.availableMonths[0].value;
  }

  open(): void {
    this.initializeForm();
    this.modalService
      .open(this.modalElement, {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'custom-modal'
      })
      .result.then(
        (result) => {},
        (reason) => {
          //forse initialize form
        }
      );
  }

  submitReportExport(form?: NgForm): void {
    if (form && (form.invalid || this.selectedMonth === null)) {
      form.control.markAllAsTouched();
      return;
    }
    this.calendarService
      .exportMonthFromCurrentYear(this.selectedMonth!)
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
            this.toastrService.error(
              'Nessun dato disponibile per il mese selezionato.',
              'Download fallito'
            );
          } else
            this.toastrService.error(
              'Si è verificato un errore durante il download del report.',
              'Download fallito'
            );
          this.modalService.dismissAll();
        },
      });
  }
}
