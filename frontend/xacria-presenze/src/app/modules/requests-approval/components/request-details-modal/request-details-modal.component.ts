import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserRequestResponseDto } from 'src/generated-client';

type handleRequestMode = 'ACCEPT' | 'REFUSE'

@Component({
  selector: 'app-request-details-modal',
  templateUrl: './request-details-modal.component.html',
  styleUrls: ['./request-details-modal.component.scss'],
})
export class RequestDetailsModalComponent {
  @Input() request?: UserRequestResponseDto;
  requestForm!: FormGroup;

  constructor(public activeModal: NgbActiveModal, public authService: AuthService) {}

  trackByIndex(index: number): number {
    return index;
  }

  onFeedback(mode: handleRequestMode): void{

  }
}
