import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcelButtonComponent } from './excel-button.component';

describe('ExcelButtonComponent', () => {
  let component: ExcelButtonComponent;
  let fixture: ComponentFixture<ExcelButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExcelButtonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcelButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
