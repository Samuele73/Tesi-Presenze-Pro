import { Component, Input, OnInit } from '@angular/core';
import {
  ApprovalRequestTab,
  PagedResponseUserRequestResponseDto,
  UserRequestResponseDto,
} from 'src/generated-client';
import { RequestStoreService } from '../../requests-approval/services/request-store.service';
import { formatDate } from '@angular/common';

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
}
