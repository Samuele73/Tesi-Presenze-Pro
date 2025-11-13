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
    await TestBed.configureTestingModule({
      declarations: [RequestsApprovalPageComponent],
      providers: [
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: RequestStoreService, useClass: RequestStoreServiceStub },
        { provide: NgbModal, useClass: NgbModalStub },
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
