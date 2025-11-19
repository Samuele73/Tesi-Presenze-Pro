import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  RequestsTableFilters,
  RequestsTableRow,
} from '../requests-table/requests-table.component';
import {
  ApprovalRequestTab,
  OpenClosedRequestNumberResponse,
  Pageable,
  PagedResponseUserRequestResponseDto,
  UserRequestResponseDto,
} from 'src/generated-client';
import { AuthService } from 'src/app/shared/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RequestDetailsModalComponent } from '../request-details-modal/request-details-modal.component';
import { RequestStoreService } from '../../services/request-store.service';
import { ToastrService } from 'ngx-toastr';

export type RequestsTab = 'open' | 'closed';

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
export class RequestsApprovalPageComponent implements OnInit, OnDestroy {
  activeTab: RequestsTab = 'open';
  openClosedCount: OpenClosedRequestNumberResponse | undefined;
  readonly tabState: Record<RequestsTab, RequestsTabState> = {
    open: this.createInitialState(),
    closed: this.createInitialState(),
  };
  readonly userOptionsByTab: Record<RequestsTab, string[]> = {
    open: [],
    closed: [],
  };
  readonly isPrivilegedUser = this.authService.isPrivilegedUser();
  private destroy$ = new Subject<void>();
  private tabRequestSubscriptions: Record<RequestsTab, Subscription | null> = {
    open: null,
    closed: null,
  };
  private currentRouteRequestId: string | null = null;

  constructor(
    private authService: AuthService,
    private modalService: NgbModal,
    private requestStoreService: RequestStoreService,
    private activatedRoute: ActivatedRoute,
    private toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.subscribeToStore();
    this.listenToRouteParams();
    if (this.isPrivilegedUser) {
      this.loadUserEmailOptions();
    }
    this.loadOpenClosedTabCount();
    this.loadTabData(this.activeTab);
    /* Prima funzionava
      this.loadTabData('close');
      this.loadTabData('open');
    */
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    (['open', 'closed'] as RequestsTab[]).forEach((tab) =>
      this.cancelOngoingRequest(tab)
    );
  }

  onTabChange(tab: RequestsTab): void {
    this.activeTab = tab;
    const state = this.tabState[tab];
    state.page = 0;
    state.filters = { types: [], users: [] };
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

  private loadOpenClosedTabCount(): void {
    this.requestStoreService
      .loadOpenClosedCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  private loadTabData(tab: RequestsTab): void {
    const state = this.tabState[tab];
    this.cancelOngoingRequest(tab);
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

    const request$ = this.requestStoreService
      .loadRequests(pageable, tabFilter, typesFilter, usersFilter)
      .pipe(
        finalize(() => {
          if (token === state.requestToken) {
            state.loading = false;
            state.initialized = true;
          }
        })
      );

    this.tabRequestSubscriptions[tab] = request$.subscribe({
      next: (success) => {
        if (!success && token === state.requestToken) {
          this.handleError(tab, token);
        }
      },
      error: () => this.handleError(tab, token),
    });
  }

  private handleStoreResponse(
    tab: RequestsTab,
    resp: PagedResponseUserRequestResponseDto | null
  ): void {
    const state = this.tabState[tab];
    if (!resp) {
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
    if (!row.original) {
      return;
    }
    this.openRequestDetailsModal(row.original);
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
    this.requestStoreService
      .loadUserEmailOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
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

  private toBackendTab(tab: RequestsTab): ApprovalRequestTab {
    return tab === 'open' ? 'OPEN' : 'CLOSED';
  }

  private subscribeToStore(): void {
    (['open', 'closed'] as RequestsTab[]).forEach((tab) => {
      const backendTab = this.toBackendTab(tab);
      this.requestStoreService
        .getRequestsByTab$(backendTab)
        .pipe(takeUntil(this.destroy$))
        .subscribe((resp) => this.handleStoreResponse(tab, resp));
    });

    this.requestStoreService.openClosedCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.openClosedCount = count ?? undefined;
      });

    if (this.isPrivilegedUser) {
      this.requestStoreService.userOptions$
        .pipe(takeUntil(this.destroy$))
        .subscribe((options) => {
          (['open', 'closed'] as RequestsTab[]).forEach((tab) => {
            this.userOptionsByTab[tab] = [...options];
          });
        });
    }
  }

  private cancelOngoingRequest(tab: RequestsTab): void {
    this.tabRequestSubscriptions[tab]?.unsubscribe();
    this.tabRequestSubscriptions[tab] = null;
  }

  private listenToRouteParams(): void {
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.handleTabQueryParam(params.get('tab'));
        this.handleSelectedRequestId(params.get('selectedRequestId'));
      });
  }

  private handleTabQueryParam(tabParam: string | null): void {
    if (!tabParam) {
      return;
    }
    const normalized = tabParam.trim().toUpperCase();
    const tabFromRoute: RequestsTab | null =
      normalized === 'CLOSED' ? 'closed' : normalized === 'OPEN' ? 'open' : null;
    if (tabFromRoute && tabFromRoute !== this.activeTab) {
      this.onTabChange(tabFromRoute);
    }
  }

  private handleSelectedRequestId(requestId: string | null): void {
    if (!requestId) {
      this.currentRouteRequestId = null;
      return;
    }
    if (requestId === this.currentRouteRequestId) {
      return;
    }
    this.currentRouteRequestId = requestId;
    this.requestStoreService
      .getRequestById(requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (request) => {
          if (request) {
            this.openRequestDetailsModal(request);
          } else {
            this.toastrService.error(
              'Impossibile caricare la richiesta selezionata'
            );
          }
        },
        error: () => {
          this.toastrService.error(
            'Impossibile caricare la richiesta selezionata'
          );
        },
      });
  }

  private openRequestDetailsModal(request: UserRequestResponseDto): void {
    const modalRef = this.modalService.open(RequestDetailsModalComponent);
    modalRef.componentInstance.request = request;
    modalRef.componentInstance.tab =
      this.activeTab === 'closed' ? 'CLOSED' : 'OPEN';
  }
}
