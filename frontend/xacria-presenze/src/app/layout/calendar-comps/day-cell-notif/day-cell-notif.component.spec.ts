import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DayCellNotifComponent } from './day-cell-notif.component';

describe('DayCellNotifComponent', () => {
  let component: DayCellNotifComponent;
  let fixture: ComponentFixture<DayCellNotifComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DayCellNotifComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DayCellNotifComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
