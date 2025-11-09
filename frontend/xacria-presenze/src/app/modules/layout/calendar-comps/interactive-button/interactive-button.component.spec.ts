import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractiveButtonComponent } from './interactive-button.component';

describe('InteractiveButtonComponent', () => {
  let component: InteractiveButtonComponent;
  let fixture: ComponentFixture<InteractiveButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InteractiveButtonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InteractiveButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
