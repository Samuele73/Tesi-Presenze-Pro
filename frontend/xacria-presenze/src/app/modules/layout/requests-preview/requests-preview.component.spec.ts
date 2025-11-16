import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestsPreviewComponent } from './requests-preview.component';

describe('RequestsPreviewComponent', () => {
  let component: RequestsPreviewComponent;
  let fixture: ComponentFixture<RequestsPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RequestsPreviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestsPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
