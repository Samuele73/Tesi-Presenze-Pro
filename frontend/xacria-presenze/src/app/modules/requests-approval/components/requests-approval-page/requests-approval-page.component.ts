import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { RequestsTableRow } from '../requests-table/requests-table.component';
import {
  CalendarService,
  Pageable,
  PagedResponseUserRequestResponseDto,
  UserRequestResponseDto,
} from 'src/generated-client';
import { AuthService } from 'src/app/shared/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RequestDetailsModalComponent } from '../request-details-modal/request-details-modal.component';

type RequestsTab = 'open' | 'closed';

interface RequestsTabState {
  rows: RequestsTableRow[];
  total: number;
  totalPages: number;
  isLast: boolean;
  page: number; // zero-based index returned by backend
  size: number;
  loading: boolean;
  initialized: boolean;
  requestToken: number;
}

@Component({
  selector: 'app-requests-approval-page',
  templateUrl: './requests-approval-page.component.html',
  styleUrls: ['./requests-approval-page.component.scss'],
})
export class RequestsApprovalPageComponent implements OnInit {
  activeTab: RequestsTab = 'open';
  readonly tabState: Record<RequestsTab, RequestsTabState> = {
    open: this.createInitialState(),
    closed: this.createInitialState(),
  };
  private readonly isPrivilegedUser = this.authService.isPrivilegedUser();
  private readonly tabStatusFilters: Record<
    RequestsTab,
    UserRequestResponseDto.StatusEnum[]
  > = {
    open: [UserRequestResponseDto.StatusEnum.PENDING],
    closed: [
      UserRequestResponseDto.StatusEnum.ACCEPTED,
      UserRequestResponseDto.StatusEnum.REJECTED,
    ],
  };

  constructor(
    private calendarService: CalendarService,
    private authService: AuthService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadTabData('open');
    this.loadTabData('closed');
  }

  onTabChange(tab: RequestsTab): void {
    this.activeTab = tab;
    const state = this.tabState[tab];
    state.page = 0;
    if (!state.initialized && !state.loading) {
      this.loadTabData(tab);
    } else {
      this.loadTabData(tab);
    }
  }

  onPageChange(tab: RequestsTab, page: number): void {
    const state = this.tabState[tab];
    const nextIndex = Math.max(0, page - 1);
    if (state.page === nextIndex) {
      return;
    }
    state.page = nextIndex;
    this.loadTabData(tab);
  }

  private loadTabData(tab: RequestsTab): void {
    const state = this.tabState[tab];
    state.requestToken += 1;
    const token = state.requestToken;
    state.loading = true;
    const pageable: Pageable = { page: state.page, size: state.size, sort: [] };

    this.getRequests$(pageable)
      .pipe(
        finalize(() => {
          if (token === state.requestToken) {
            state.loading = false;
            state.initialized = true;
          }
        })
      )
      .subscribe({
        next: (resp) => this.handleResponse(tab, resp, token),
        error: () => this.handleError(tab, token),
      });
  }

  private handleResponse(
    tab: RequestsTab,
    resp: PagedResponseUserRequestResponseDto,
    token: number
  ): void {
    const state = this.tabState[tab];
    if (token !== state.requestToken) {
      return;
    }
    const content = resp.content ?? [];
    const filtered = content.filter((entry) =>
      this.matchesTabStatus(tab, entry.status ?? undefined)
    );
    state.rows = filtered.map((entry) => this.mapToRow(entry));
    state.total = this.deriveTotalFromResponse(resp, filtered.length);
    state.page =
      typeof resp.page === 'number' ? resp.page : state.page ?? 0;
    if (typeof resp.size === 'number' && resp.size > 0) {
      state.size = resp.size;
    }
    if (typeof resp.totalPages === 'number') {
      state.totalPages = resp.totalPages;
    }
    if (typeof resp.last === 'boolean') {
      state.isLast = resp.last;
    }
  }

  private handleError(tab: RequestsTab, token: number): void {
    const state = this.tabState[tab];
    if (token !== state.requestToken) {
      return;
    }
    state.rows = [];
    state.total = 0;
    state.totalPages = 0;
    state.isLast = true;
    state.page = 0;
  }

  private matchesTabStatus(
    tab: RequestsTab,
    status: UserRequestResponseDto.StatusEnum | undefined
  ): boolean {
    if (!status) {
      return tab === 'open';
    }
    return this.tabStatusFilters[tab].includes(status);
  }

  onRowSelected(row: RequestsTableRow): void {
    if (!this.authService.isPrivilegedUser() || !row.original) {
      return;
    }
    const modalRef = this.modalService.open(RequestDetailsModalComponent);
    modalRef.componentInstance.request = row.original;
  }

  private mapToRow(request: UserRequestResponseDto): RequestsTableRow {
    const withTime = request as UserRequestResponseDto & {
      timeFrom?: string;
      timeTo?: string;
    };
    return {
      id: request.id,
      user: request.userEmail ?? '—',
      dateFrom: request.dateFrom ?? undefined,
      timeFrom: withTime.timeFrom,
      dateTo: request.dateTo ?? undefined,
      timeTo: withTime.timeTo,
      type: request.type ?? '—',
      status: request.status ?? undefined,
      original: request,
    };
  }

  private createInitialState(): RequestsTabState {
    return {
      rows: [],
      total: 0,
      totalPages: 0,
      isLast: false,
      page: 0,
      size: 10,
      loading: false,
      initialized: false,
      requestToken: 0,
    };
  }

  private getRequests$(
    pageable: Pageable
  ): Observable<PagedResponseUserRequestResponseDto> {
    return this.isPrivilegedUser
      ? this.calendarService.getAllRequests(pageable)
      : this.calendarService.getUserRequests(pageable);
  }

  private deriveTotalFromResponse(
    resp: PagedResponseUserRequestResponseDto,
    fallback: number
  ): number {
    if (typeof resp.totalElements === 'number') {
      return resp.totalElements;
    }
    return fallback;
  }
}
