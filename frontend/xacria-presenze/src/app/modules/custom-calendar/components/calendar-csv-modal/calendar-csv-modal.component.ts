import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-calendar-csv-modal',
  templateUrl: './calendar-csv-modal.component.html',
  styleUrls: ['./calendar-csv-modal.component.scss']
})
export class CalendarCsvModalComponent {
  @ViewChild('addProjectModal', { static: true }) modalElement!: TemplateRef<Modal>;
  @Input() currentDate?: Date;

  constructor(private modalService: NgbModal) { }

  submitMonthExport(){

  }

  initializeForm(): void{

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
