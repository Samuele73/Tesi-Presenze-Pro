import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/shared/services/auth.service';
import {
  ApprovalAction,
  BooleanResponse,
  CalendarService,
  UserRequestResponseDto,
} from 'src/generated-client';

@Component({
  selector: 'app-request-details-modal',
  templateUrl: './request-details-modal.component.html',
  styleUrls: ['./request-details-modal.component.scss'],
})
export class RequestDetailsModalComponent {
  @Input() request?: UserRequestResponseDto;

  constructor(
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    private calendarService: CalendarService,
    private toastrService: ToastrService
  ) {}

  trackByIndex(index: number): number {
    return index;
  }

  onFeedback(mode: ApprovalAction): void {
    if (this.request?.id)
      this.calendarService
        .updateRequestStatus(mode, this.request.id)
        .subscribe({
          next: (value: BooleanResponse) => {
            value
              ? this.toastrService.success('Richiesta aggiornata con successo')
              : this.toastrService.error('richiesta aggiornata con difetto');
          },
          error: (err: HttpErrorResponse) => {
            this.toastrService.error(err.error.message);
          },
          complete: () => {
            this.activeModal.dismiss();
          }
        });
    else this.toastrService.error('Nessun id presente nella richiesta');
  }
}
