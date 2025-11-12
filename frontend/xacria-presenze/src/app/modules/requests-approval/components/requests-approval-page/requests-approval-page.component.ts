import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  RequestsTableFilters,
  RequestsTableRow,
} from '../requests-table/requests-table.component';
import {
  CalendarService,
  Pageable,
  PagedResponseUserRequestResponseDto,
  UserRequestResponseDto,
  UserService,
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
  filters: RequestsTableFilters;
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
  readonly userOptionsByTab: Record<RequestsTab, string[]> = {
    open: [],
    closed: [],
  };
  readonly isPrivilegedUser = this.authService.isPrivilegedUser();

  constructor(
    private calendarService: CalendarService,
    private authService: AuthService,
    private modalService: NgbModal,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    if (this.isPrivilegedUser) {
      this.loadUserEmailOptions();
    }
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

  onFiltersChange(tab: RequestsTab, filters: RequestsTableFilters): void {
    const state = this.tabState[tab];
    state.filters = {
      types: filters.types ?? [],
      users: filters.users ?? [],
    };
    state.page = 0;
    this.loadTabData(tab);
  }

  private loadTabData(tab: RequestsTab): void {
    const state = this.tabState[tab];
    state.requestToken += 1;
    const token = state.requestToken;
    state.loading = true;
    const pageable: Pageable & { toString(): string } = {
      page: state.page,
      size: state.size,
      sort: [],
      toString() {
        return JSON.stringify({
          page: this.page,
          size: this.size,
          sort: this.sort ?? [],
        });
      },
    };

    const typesFilter =
      state.filters.types && state.filters.types.length
        ? state.filters.types
        : undefined;
    const usersFilter =
      this.isPrivilegedUser &&
      state.filters.users &&
      state.filters.users.length
        ? state.filters.users
        : undefined;

    const tabFilter = this.toBackendTab(tab);

    this.getRequests$(pageable, tabFilter, typesFilter, usersFilter)
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
    state.rows = content.map((entry) => this.mapToRow(entry));
    state.total = this.deriveTotalFromResponse(resp, content.length);
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
      filters: { types: [], users: [] },
    };
  }

  private loadUserEmailOptions(): void {
    this.userService.getRoleBasedUsersEmail().subscribe({
      next: (emails) => {
        const sorted = (emails ?? []).slice().sort();
        (['open', 'closed'] as RequestsTab[]).forEach((tab) => {
          this.userOptionsByTab[tab] = [...sorted];
        });
      },
      error: () => {
        (['open', 'closed'] as RequestsTab[]).forEach((tab) => {
          this.userOptionsByTab[tab] = [];
        });
      },
    });
  }

  private getRequests$(
    pageable: Pageable,
    tab: string,
    types?: UserRequestResponseDto.TypeEnum[],
    users?: string[]
  ): Observable<PagedResponseUserRequestResponseDto> {
    return this.isPrivilegedUser
      ? this.calendarService.getAllRequests(
          pageable,
          tab,
          types as string[] | undefined,
          users
        )
      : this.calendarService.getUserRequests(
          pageable,
          tab,
          types as string[] | undefined
        );
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

  private toBackendTab(tab: RequestsTab): string {
    return tab === 'open' ? 'OPEN' : 'CLOSED';
  }
}
