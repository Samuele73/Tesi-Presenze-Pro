import { Component, Input } from '@angular/core';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { CalendarCsvModalComponent } from '../calendar-csv-modal/calendar-csv-modal.component';

@Component({
  selector: 'app-excel-button',
  templateUrl: './excel-button.component.html',
  styleUrls: ['./excel-button.component.scss'],
})
export class ExcelButtonComponent {
  @Input() buttonClass: string = '';
  @Input() currentDate!: Date;
  faDownload = faDownload;

  constructor() {}

  openExportModal(modal: CalendarCsvModalComponent) {
    modal.open();
  }
}
