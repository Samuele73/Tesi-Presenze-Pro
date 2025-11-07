import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgbOptionsComponent } from './ngb-options.component';

describe('NgbOptionsComponent', () => {
  let component: NgbOptionsComponent;
  let fixture: ComponentFixture<NgbOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgbOptionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgbOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
