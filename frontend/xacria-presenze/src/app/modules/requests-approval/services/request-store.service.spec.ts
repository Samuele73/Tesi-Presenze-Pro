import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import {
  ApprovalAction,
  CalendarService,
  Pageable,
  PagedResponseUserRequestResponseDto,
  UserService,
} from 'src/generated-client';

import { RequestStoreService } from './request-store.service';

describe('RequestStoreService', () => {
  let service: RequestStoreService;
  let calendarServiceSpy: jasmine.SpyObj<CalendarService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(() => {
    calendarServiceSpy = jasmine.createSpyObj('CalendarService', [
      'getAllRequests',
      'getUserRequests',
      'getOpenClosedRequestsNumber',
      'updateRequestStatus',
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isPrivilegedUser',
    ]);
    userServiceSpy = jasmine.createSpyObj('UserService', [
      'getRoleBasedUsersEmail',
    ]);

    authServiceSpy.isPrivilegedUser.and.returnValue(true);
    calendarServiceSpy.getAllRequests.and.returnValue(
      of({ content: [] } as PagedResponseUserRequestResponseDto) as any
    );
    calendarServiceSpy.getUserRequests.and.returnValue(
      of({ content: [] } as PagedResponseUserRequestResponseDto) as any
    );
    calendarServiceSpy.getOpenClosedRequestsNumber.and.returnValue(
      of({ OPEN: 0, CLOSED: 0 }) as any
    );
    calendarServiceSpy.updateRequestStatus.and.returnValue(
      of({ resp: true }) as any
    );
    userServiceSpy.getRoleBasedUsersEmail.and.returnValue(
      of(['user@test.com']) as any
    );

    TestBed.configureTestingModule({
      providers: [
        RequestStoreService,
        { provide: CalendarService, useValue: calendarServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
      ],
    });
    service = TestBed.inject(RequestStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load requests and update the snapshot', (done) => {
    const pageable: Pageable = { page: 0, size: 10, sort: [] };

    service.loadRequests(pageable, 'OPEN').subscribe((result) => {
      expect(result).toBeTrue();
      expect(service.getRequestsSnapshot('OPEN')).toEqual(
        jasmine.objectContaining({ content: [] })
      );
      done();
    });
  });

  it('should load user email options and emit sorted entries', async () => {
    userServiceSpy.getRoleBasedUsersEmail.and.returnValue(
      of(['beta@example.com', 'alpha@example.com']) as any
    );

    await firstValueFrom(service.loadUserEmailOptions());
    const options = await firstValueFrom(service.userOptions$);
    expect(options).toEqual(['alpha@example.com', 'beta@example.com']);
  });

  it('should refresh counters after updating request status', (done) => {
    calendarServiceSpy.getOpenClosedRequestsNumber.calls.reset();
    service
      .updateRequestStatus('APPROVE' as ApprovalAction, 'req-1')
      .subscribe((result) => {
        expect(result).toBeTrue();
        expect(calendarServiceSpy.getOpenClosedRequestsNumber).toHaveBeenCalled();
        done();
      });
  });
});
