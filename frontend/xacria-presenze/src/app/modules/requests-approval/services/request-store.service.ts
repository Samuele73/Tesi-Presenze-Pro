import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ApprovalAction,
  ApprovalRequestTab,
  CalendarService,
  OpenClosedRequestNumberResponse,
  Pageable,
  PagedResponseUserRequestResponseDto,
  UserRequestResponseDto,
  UserService,
} from 'src/generated-client';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';

type RequestsState = Record<
  ApprovalRequestTab,
  PagedResponseUserRequestResponseDto | null
>;

@Injectable({
  providedIn: 'root',
})
export class RequestStoreService {
  private static createInitialRequestsState(): RequestsState {
    return {
      OPEN: null,
      CLOSED: null,
    };
  }

  private requestsSubject = new BehaviorSubject<RequestsState>(
    RequestStoreService.createInitialRequestsState()
  );
  private openClosedCountSubject =
    new BehaviorSubject<OpenClosedRequestNumberResponse | null>(null);
  private userOptionsSubject = new BehaviorSubject<string[]>([]);

  constructor(
    private calendarService: CalendarService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  get requests$() {
    return this.requestsSubject.asObservable();
  }

  get openClosedCount$() {
    return this.openClosedCountSubject.asObservable();
  }

  get userOptions$() {
    return this.userOptionsSubject.asObservable();
  }

  getRequestsByTab$(tab: ApprovalRequestTab) {
    return this.requestsSubject.asObservable().pipe(map((state) => state[tab]));
  }

  getRequestsSnapshot(tab: ApprovalRequestTab) {
    return this.requestsSubject.value[tab];
  }

  loadRequests(
    pageable: Pageable,
    tab: ApprovalRequestTab,
    types?: Array<UserRequestResponseDto.TypeEnum | string>,
    users?: Array<string>
  ): Observable<boolean> {
    const normalizedTypes = types?.map((type) => type.toString());
    const request$ = this.authService.isPrivilegedUser()
      ? this.calendarService.getAllRequests(
          pageable,
          tab,
          normalizedTypes,
          users
        )
      : this.calendarService.getUserRequests(pageable, tab, normalizedTypes);

    return request$.pipe(
      tap((response: PagedResponseUserRequestResponseDto) => {
        this.requestsSubject.next({
          ...this.requestsSubject.value,
          [tab]: response,
        });
      }),
      map(() => true),
      catchError((err: HttpErrorResponse) => {
        console.warn('Error while loading requests', err);
        return of(false);
      })
    );
  }

  updateRequestStatus(
    action: ApprovalAction,
    requestId: string
  ): Observable<boolean> {
    return this.calendarService.updateRequestStatus(action, requestId).pipe(
      switchMap((resp) => {
        if (!resp?.resp) {
          return of(false);
        }
        this.removeRequestFromAllTabs(requestId);
        return this.loadOpenClosedCount();
      }),
      catchError((err: HttpErrorResponse) => {
        console.warn('Error while updating request status', err);
        return of(false);
      })
    );
  }

  loadOpenClosedCount(): Observable<boolean> {
    return this.calendarService.getOpenClosedRequestsNumber().pipe(
      tap((response: OpenClosedRequestNumberResponse) => {
        this.openClosedCountSubject.next(response);
      }),
      map(() => true),
      catchError((err: HttpErrorResponse) => {
        console.warn('Error while loading open/closed counters', err);
        return of(false);
      })
    );
  }

  loadUserEmailOptions(): Observable<boolean> {
    return this.userService.getRoleBasedUsersEmail().pipe(
      tap((emails: string[]) => {
        const sorted = (emails ?? []).slice().sort();
        this.userOptionsSubject.next(sorted);
      }),
      map(() => true),
      catchError((err: HttpErrorResponse) => {
        console.warn('Error while loading privileged user emails', err);
        this.userOptionsSubject.next([]);
        return of(false);
      })
    );
  }

  getRequestById(requestId: string): Observable<UserRequestResponseDto | null> {
    return this.calendarService.getRequestById(requestId).pipe(
      catchError((err: HttpErrorResponse) => {
        console.warn('Error while loading request by id', err);
        return of(null);
      })
    );
  }

  private removeRequestFromAllTabs(requestId: string): void {
    const currentState = this.requestsSubject.value;
    const nextState: RequestsState = { ...currentState };
    let hasChanges = false;

    (Object.keys(currentState) as ApprovalRequestTab[]).forEach((tab) => {
      const pageData = currentState[tab];

      if (!pageData || !pageData.content?.length) {
        return;
      }

      const filtered = pageData.content.filter(
        (request) => request.id !== requestId
      );

      if (filtered.length === pageData.content.length) {
        return;
      }

      hasChanges = true;
      nextState[tab] = {
        ...pageData,
        content: filtered,
        totalElements:
          typeof pageData.totalElements === 'number'
            ? Math.max(pageData.totalElements - 1, 0)
            : pageData.totalElements,
      };
    });

    if (hasChanges) {
      this.requestsSubject.next(nextState);
    }
  }
}
