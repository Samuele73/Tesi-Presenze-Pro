import { TestBed } from '@angular/core/testing';

import { SinginInvitationGuard } from './singin-invitation.guard';

describe('SinginInvitationGuard', () => {
  let guard: SinginInvitationGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SinginInvitationGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
