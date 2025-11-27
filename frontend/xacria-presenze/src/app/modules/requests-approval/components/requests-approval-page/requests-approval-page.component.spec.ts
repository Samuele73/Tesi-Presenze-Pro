import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { RequestsApprovalPageComponent } from './requests-approval-page.component';
import { RequestStoreService } from '../../services/request-store.service';
import {
  OpenClosedRequestNumberResponse,
  PagedResponseUserRequestResponseDto,
} from 'src/generated-client';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ToastI18nService } from 'src/app/shared/services/toast-i18n.service';

class AuthServiceStub {
  isPrivilegedUser(): boolean {
    return true;
  }
}

class RequestStoreServiceStub {
  private responses: Record<
    'OPEN' | 'CLOSED',
    BehaviorSubject<PagedResponseUserRequestResponseDto | null>
  > = {
    OPEN: new BehaviorSubject<PagedResponseUserRequestResponseDto | null>({
      content: [],
    }),
    CLOSED: new BehaviorSubject<PagedResponseUserRequestResponseDto | null>({
      content: [],
    }),
  };

  openClosedCount$ = new BehaviorSubject<OpenClosedRequestNumberResponse | null>(
    { OPEN: 0, CLOSED: 0 }
  );

  userOptions$ = new BehaviorSubject<string[]>([]);

  getRequestsByTab$(tab: 'OPEN' | 'CLOSED') {
    return this.responses[tab].asObservable();
  }

  loadRequests() {
    return of(true);
  }

  loadOpenClosedCount() {
    return of(true);
  }

  loadUserEmailOptions() {
    return of(true);
  }

  getRequestById() {
    return of(null);
  }
}

class NgbModalStub {
  open() {
    return {
      componentInstance: {},
    } as any;
  }
}

describe('RequestsApprovalPageComponent', () => {
  let component: RequestsApprovalPageComponent;
  let fixture: ComponentFixture<RequestsApprovalPageComponent>;

  beforeEach(async () => {
    const queryParamMap$ = new BehaviorSubject(
      convertToParamMap({})
    );

    await TestBed.configureTestingModule({
      declarations: [RequestsApprovalPageComponent],
      providers: [
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: RequestStoreService, useClass: RequestStoreServiceStub },
        { provide: NgbModal, useClass: NgbModalStub },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap$.asObservable() } },
        { provide: ToastI18nService, useValue: { error: () => {} } },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(RequestsApprovalPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
