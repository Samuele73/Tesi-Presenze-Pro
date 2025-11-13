import { TestBed } from '@angular/core/testing';

import { CustomCalendarGuard } from './custom-calendar.guard';

describe('CustomCalendarGuard', () => {
  let guard: CustomCalendarGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(CustomCalendarGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
