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
import { DateFormatService } from 'src/app/shared/services/date-format.service';

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
    private notifService: NotificationService,
    public dateService: DateFormatService
  ) {}

  requestsInitialState(): PagedResponseUserRequestResponseDto {
    return {};
  }

  getRequestTitle(): string {
    return this.requestMode == 'OPEN' ? 'Richieste aperte' : 'Richieste chiuse';
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
}
