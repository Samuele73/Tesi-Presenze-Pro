import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Modal } from 'bootstrap';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-calendar-csv-modal',
  templateUrl: './calendar-csv-modal.component.html',
  styleUrls: ['./calendar-csv-modal.component.scss']
})
export class CalendarCsvModalComponent {
  @ViewChild('addProjectModal', { static: true }) modalElement!: TemplateRef<Modal>;
  @Input() currentDate?: Date;
  availableMonths: { value: number; label: string }[] = [];
  selectedMonth: number | null = null;
  private readonly locale =
    typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'it-IT';

  constructor(private modalService: NgbModal) { }

  submitMonthExport(form?: NgForm){
    if (form && (form.invalid || this.selectedMonth === null)) {
      form.control.markAllAsTouched();
      return;
    }
    // TODO: handle month export with this.selectedMonth
  }

  initializeForm(): void{
    const today = new Date();
    const currentMonthIndex = today.getMonth();
    this.availableMonths = Array.from({ length: currentMonthIndex + 1 }, (_, idx) => {
      const monthIndex = currentMonthIndex - idx;
      return {
        value: monthIndex,
        label: new Date(today.getFullYear(), monthIndex, 1).toLocaleString(this.locale, {
          month: 'long',
        }),
      };
    });
    if (!this.availableMonths.length) {
      this.selectedMonth = null;
      return;
    }
    const initialMonth = this.currentDate ? this.currentDate.getMonth() : currentMonthIndex;
    const limitedInitialMonth = Math.min(initialMonth, currentMonthIndex);
    const matchedMonth = this.availableMonths.find(
      (month) => month.value === limitedInitialMonth
    );
    this.selectedMonth = matchedMonth ? matchedMonth.value : this.availableMonths[0].value;
  }

  open(): void {
    this.initializeForm();
    this.modalService
      .open(this.modalElement, {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'custom-modal',
      })
      .result.then(
        (result) => {

        },
        (reason) => {
          //forse initialize form
        }
      );
  }
}
