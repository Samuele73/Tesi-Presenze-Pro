import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkingTripModalComponent } from './working-trip-modal.component';

describe('WorkingTripModalComponent', () => {
  let component: WorkingTripModalComponent;
  let fixture: ComponentFixture<WorkingTripModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkingTripModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkingTripModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
