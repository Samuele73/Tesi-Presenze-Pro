import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/shared/services/auth.service';
import { RequestStoreService } from '../../services/request-store.service';
import {
  ApprovalAction,
  UserEmailResponse,
  UserRequestResponseDto,
} from 'src/generated-client';
import { RequestsTab } from '../requests-approval-page/requests-approval-page.component';
import { DateFormatService } from 'src/app/shared/services/date-format.service';
import { formatDate } from '@angular/common';
import { ToastI18nService } from 'src/app/shared/services/toast-i18n.service';

@Component({
  selector: 'app-request-details-modal',
  templateUrl: './request-details-modal.component.html',
  styleUrls: ['./request-details-modal.component.scss'],
})
export class RequestDetailsModalComponent {
  @Input() request?: UserRequestResponseDto;
  @Input() tab!: RequestsTab;
  title = '';
  isEditMode?: boolean;
  statusLabelMap: { [key: string]: string } = {
    PENDING: 'IN ATTESA',
    ACCEPTED: 'ACCETTATA',
    REJECTED: 'RIFIUTATA',
  };
  statusClassMap: { [key: string]: string } = {
    PENDING: 'bg-warning',
    ACCEPTED: 'bg-primary',
    REJECTED: 'bg-danger',
  };

  constructor(
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    private requestStoreService: RequestStoreService,
    private toast: ToastI18nService,
    public dateService: DateFormatService
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
          if(this.tab.toUpperCase() === 'CLOSED'){
            this.isEditMode = false;
            this.title = 'Visualizza richiesta';
            return;
          }
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
          this.toast.error(
            'Errore con il reperimento dell email utente: ' + err.error.message
          );
        },
      });
  }

  onFeedback(mode: ApprovalAction): void {
    if (!this.request?.id) {
      this.toast.error('Nessun id presente nella richiesta');
      return;
    }

    this.requestStoreService
      .updateRequestStatus(mode, this.request.id)
      .subscribe({
        next: (success: boolean) => {
          success
            ? this.toast.success('Richiesta aggiornata con successo')
            : this.toast.error('Impossibile gestire la richiesta');
        },
        error: (err: HttpErrorResponse) => {
          this.toast.error(err.error?.message ?? 'Errore sconosciuto');
        },
        complete: () => {
          this.activeModal.dismiss();
        },
      });
  }

  shouldHaveTime(type: UserRequestResponseDto.TypeEnum | undefined){
    return type !== "TRASFERTA" && type !== "CONGEDO" && type !== "FERIE"
  }

  getSingleDateWithTime(dateFrom: string | Date, dateTo: string | Date): string{
    const date = formatDate(dateFrom, 'dd-MM-yyyy', 'en-GB');
    const timeFrom = formatDate(dateFrom, 'HH:mm', 'en-GB');
    const timeTo = formatDate(dateTo, 'HH:mm', 'en-GB')
    return date + " " + timeFrom + "-" + timeTo
  }
}
