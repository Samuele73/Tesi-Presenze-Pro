import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePwComponent } from './update-pw.component';

describe('UpdatePwComponent', () => {
  let component: UpdatePwComponent;
  let fixture: ComponentFixture<UpdatePwComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdatePwComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePwComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
