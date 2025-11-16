import { Component, Input, OnInit } from '@angular/core';
import {
  ApprovalRequestTab,
  PagedResponseUserRequestResponseDto,
} from 'src/generated-client';
import { RequestStoreService } from '../../requests-approval/services/request-store.service';

export type requestMode = ApprovalRequestTab;

@Component({
  selector: 'app-requests-preview',
  templateUrl: './requests-preview.component.html',
  styleUrls: ['./requests-preview.component.scss'],
})
export class RequestsPreviewComponent {
  requests: PagedResponseUserRequestResponseDto = this.requestsInitialState();
  @Input() requestMode!: string;

  requestsInitialState(): PagedResponseUserRequestResponseDto {
    return {};
  }

  getRequestTitle(): string{
    return this.requestMode == 'OPEN' ? 'Richieste aperte' : 'Richieste chiuse'
  }
}
