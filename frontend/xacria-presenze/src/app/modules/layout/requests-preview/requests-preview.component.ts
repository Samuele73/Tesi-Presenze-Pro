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
  @Input() requests: PagedResponseUserRequestResponseDto = this.requestsInitialState();
  @Input() requestMode!: string;
  @Input() visualizeNumber: boolean = false;

  constructor(private router: Router, private notifService: NotificationService) {}

  requestsInitialState(): PagedResponseUserRequestResponseDto {
    return {};
  }

  getRequestTitle(): string{
    return this.requestMode == 'OPEN' ? 'Richieste aperte' : 'Richieste chiuse'
  }

  formatDateTime(
      date: Date | undefined,
      requestType: UserRequestResponseDto.TypeEnum | undefined
    ): string {

      if (!date || !requestType) {
        return '—';
      }
      if (requestType == 'TRASFERTA')
        return formatDate(date, 'dd-MM-yyyy', 'en-GB');
      return formatDate(date, 'dd-MM-yyyy HH:mm', 'en-GB');
    }

    onRequestClick(request: UserRequestResponseDto){
      let queryParams = { selectedRequestId: request.id, tab : "CLOSED"};
      if(this.requestMode.toUpperCase() == 'OPEN')
        queryParams = { selectedRequestId: request.id, tab: "OPEN"};
      this.router.navigate([APP_ROUTES.REQUESTS_APPROVAL.DEFAULT], { queryParams: queryParams });
      this.notifService.readNotif();
    }
}
