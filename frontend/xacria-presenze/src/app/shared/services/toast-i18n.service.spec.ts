import { TestBed } from '@angular/core/testing';

import { ToastI18nService } from './toast-i18n.service';

describe('ToastI18nService', () => {
  let service: ToastI18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastI18nService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
