import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserRequestResponseDto } from 'src/generated-client';

@Component({
  selector: 'app-request-details-modal',
  templateUrl: './request-details-modal.component.html',
  styleUrls: ['./request-details-modal.component.scss'],
})
export class RequestDetailsModalComponent {
  @Input() request?: UserRequestResponseDto;

  constructor(public activeModal: NgbActiveModal) {}

  trackByIndex(index: number): number {
    return index;
  }
}
