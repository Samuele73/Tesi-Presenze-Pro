import { TestBed } from '@angular/core/testing';

import { SigninInvitationGuard } from './singin-invitation.guard';

describe('SigninInvitationGuard', () => {
  let guard: SigninInvitationGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SigninInvitationGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
