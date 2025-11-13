import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/shared/services/auth.service';
import { RequestStoreService } from '../../services/request-store.service';
import { ApprovalAction, UserRequestResponseDto } from 'src/generated-client';

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
    private requestStoreService: RequestStoreService,
    private toastrService: ToastrService
  ) {}

  trackByIndex(index: number): number {
    return index;
  }

  onFeedback(mode: ApprovalAction): void {
    if (!this.request?.id) {
      this.toastrService.error('Nessun id presente nella richiesta');
      return;
    }

    this.requestStoreService
      .updateRequestStatus(mode, this.request.id)
      .subscribe({
        next: (success: boolean) => {
          success
            ? this.toastrService.success('Richiesta aggiornata con successo')
            : this.toastrService.error('richiesta aggiornata con difetto');
        },
        error: (err: HttpErrorResponse) => {
          this.toastrService.error(err.error?.message ?? 'Errore sconosciuto');
        },
        complete: () => {
          this.activeModal.dismiss();
        },
      });
  }
}
