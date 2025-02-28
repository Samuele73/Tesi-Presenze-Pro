import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DayworkModalComponent } from './daywork-modal.component';

describe('DayworkModalComponent', () => {
  let component: DayworkModalComponent;
  let fixture: ComponentFixture<DayworkModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DayworkModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DayworkModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
