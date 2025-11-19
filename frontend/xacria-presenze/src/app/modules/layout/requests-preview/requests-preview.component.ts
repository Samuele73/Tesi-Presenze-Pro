import { Component, Input, OnInit } from '@angular/core';
import {
  ApprovalRequestTab,
  PagedResponseUserRequestResponseDto,
  UserRequestResponseDto,
} from 'src/generated-client';
import { RequestStoreService } from '../../requests-approval/services/request-store.service';
import { formatDate } from '@angular/common';
import { Router } from '@angular/router';
import { APP_ROUTES } from 'src/app/shared/constants/route-paths';
import { NotificationService } from 'src/app/shared/services/notification.service';

export type requestMode = ApprovalRequestTab;

@Component({
  selector: 'app-requests-preview',
  templateUrl: './requests-preview.component.html',
  styleUrls: ['./requests-preview.component.scss'],
})
export class RequestsPreviewComponent {
  @Input() requests: PagedResponseUserRequestResponseDto =
    this.requestsInitialState();
  @Input() requestMode!: string;
  @Input() visualizeNumber: boolean = false;

  constructor(
    private router: Router,
    private notifService: NotificationService
  ) {}

  requestsInitialState(): PagedResponseUserRequestResponseDto {
    return {};
  }

  getRequestTitle(): string {
    return this.requestMode == 'OPEN' ? 'Richieste aperte' : 'Richieste chiuse';
  }

  formatDateTime(
    date: Date | undefined,
    requestType: UserRequestResponseDto.TypeEnum | undefined,
    noTime: boolean = false
  ): string {
    if (!date || !requestType) {
      return '—';
    }
    if (requestType == 'TRASFERTA' || requestType == 'FERIE' || noTime)
      return formatDate(date, 'dd-MM-yyyy', 'en-GB');
    return formatDate(date, 'dd-MM-yyyy HH:mm', 'en-GB');
  }

  getTimeFromDate(date: Date | undefined): string {
    if (!date) {
      return '—';
    }
    return formatDate(date, 'HH:mm', 'en-GB');
  }

  onRequestClick(request: UserRequestResponseDto) {
    let queryParams = { selectedRequestId: request.id, tab: 'CLOSED' };
    if (this.requestMode.toUpperCase() == 'OPEN')
      queryParams = { selectedRequestId: request.id, tab: 'OPEN' };
    this.router.navigate([APP_ROUTES.REQUESTS_APPROVAL.DEFAULT], {
      queryParams: queryParams,
    });
    this.notifService.readNotif();
  }

  redirectToRequests(requestMode: string) {
    this.router.navigate([APP_ROUTES.REQUESTS_APPROVAL.DEFAULT], {
      queryParams: { tab: requestMode.toUpperCase() },
    });
  }

  areDatesEqual(dateFrom: any, dateTo: any): boolean {
    if (!dateFrom || !dateTo) return false;

    const d1 = new Date(dateFrom);
    const d2 = new Date(dateTo);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }
}
