import { TestBed } from '@angular/core/testing';

import { RequestsApprovalGuard } from './requests-approval.guard';

describe('RequestsApprovalGuard', () => {
  let guard: RequestsApprovalGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(RequestsApprovalGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
