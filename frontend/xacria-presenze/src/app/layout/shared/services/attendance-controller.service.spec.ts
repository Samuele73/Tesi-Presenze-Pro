import { TestBed } from '@angular/core/testing';

import { AttendanceControllerService } from './attendance-controller.service';

describe('AttendanceControllerService', () => {
  let service: AttendanceControllerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttendanceControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
