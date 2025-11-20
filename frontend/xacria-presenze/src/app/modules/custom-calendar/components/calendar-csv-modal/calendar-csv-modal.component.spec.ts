import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarCsvModalComponent } from './calendar-csv-modal.component';

describe('CalendarCsvModalComponent', () => {
  let component: CalendarCsvModalComponent;
  let fixture: ComponentFixture<CalendarCsvModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CalendarCsvModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarCsvModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
