import { TestBed } from '@angular/core/testing';

import { UserBasicDetailsStoreService } from './user-basic-details-store.service';

describe('UserStoreService', () => {
  let service: UserBasicDetailsStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserBasicDetailsStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
