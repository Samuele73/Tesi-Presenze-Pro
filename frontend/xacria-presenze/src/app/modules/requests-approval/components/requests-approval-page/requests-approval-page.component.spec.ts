import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestsApprovalPageComponent } from './requests-approval-page.component';

describe('RequestsApprovalPageComponent', () => {
  let component: RequestsApprovalPageComponent;
  let fixture: ComponentFixture<RequestsApprovalPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RequestsApprovalPageComponent ]
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
