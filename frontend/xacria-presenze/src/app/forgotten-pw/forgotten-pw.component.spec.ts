import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgottenPwComponent } from './forgotten-pw.component';

describe('ForgottenPwComponent', () => {
  let component: ForgottenPwComponent;
  let fixture: ComponentFixture<ForgottenPwComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForgottenPwComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForgottenPwComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
