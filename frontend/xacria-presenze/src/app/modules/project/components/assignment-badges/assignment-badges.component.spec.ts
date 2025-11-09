import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentBadgesComponent } from './assignment-badges.component';

describe('AssignmentBadgesComponent', () => {
  let component: AssignmentBadgesComponent;
  let fixture: ComponentFixture<AssignmentBadgesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssignmentBadgesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignmentBadgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
