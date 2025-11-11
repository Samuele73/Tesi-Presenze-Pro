import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CalendarService } from 'src/generated-client';
import { AuthService } from 'src/app/shared/services/auth.service';
import { RequestsApprovalPageComponent } from './requests-approval-page.component';

class CalendarServiceStub {
  getAllRequests(_pageable?: any) {
    return of({
      content: [],
      page: 0,
      size: 10,
      totalElements: 0,
    });
  }

  getUserRequests(pageable: any) {
    return this.getAllRequests();
  }
}

class AuthServiceStub {
  isPrivilegedUser(): boolean {
    return true;
  }
}

describe('RequestsApprovalPageComponent', () => {
  let component: RequestsApprovalPageComponent;
  let fixture: ComponentFixture<RequestsApprovalPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RequestsApprovalPageComponent],
      providers: [
        { provide: CalendarService, useClass: CalendarServiceStub },
        { provide: AuthService, useClass: AuthServiceStub },
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
