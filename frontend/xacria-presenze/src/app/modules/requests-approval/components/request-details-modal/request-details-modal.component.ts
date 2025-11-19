import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/shared/services/auth.service';
import { RequestStoreService } from '../../services/request-store.service';
import {
  ApprovalAction,
  UserEmailResponse,
  UserRequestResponseDto,
} from 'src/generated-client';

@Component({
  selector: 'app-request-details-modal',
  templateUrl: './request-details-modal.component.html',
  styleUrls: ['./request-details-modal.component.scss'],
})
export class RequestDetailsModalComponent {
  @Input() request?: UserRequestResponseDto;
  title = '';
  isEditMode?: boolean;

  constructor(
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    private requestStoreService: RequestStoreService,
    private toastrService: ToastrService
  ) {
    if(this.isEditMode === undefined)
      this.checkIfEditMode();
  }

  trackByIndex(index: number): number {
    return index;
  }

  checkIfEditMode(): void {
    const $userEmail = this.authService.getUserEmail();
    if ($userEmail)
      $userEmail.subscribe({
        next: (email: UserEmailResponse) => {
          if (
            (!(this.request?.userEmail === email.email) &&
              this.authService.isAdmin()) ||
            this.authService.isOwner()
          ) {
            this.isEditMode = true;
            this.title = 'Gestisci richiesta';
          } else {
            this.isEditMode = false;
            this.title = 'Visualizza richiesta';
          }
        },
        error: (err: HttpErrorResponse) => {
          this.toastrService.error(
            'Errore con il reperimento dell email utente: ' + err.error.message
          );
        },
      });
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
            : this.toastrService.error('Impossibile gestire la richiesta');
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
