import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvitationErrorComponent } from './invitation-error.component';

describe('InvitationErrorComponent', () => {
  let component: InvitationErrorComponent;
  let fixture: ComponentFixture<InvitationErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvitationErrorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvitationErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
