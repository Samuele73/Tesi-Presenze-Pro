import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IndividualConfig, ToastrService, ToastContainerDirective } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class ToastI18nService {
  constructor(private toastr: ToastrService, private translate: TranslateService) {}

  success(key: string, titleKey?: string, opts?: Partial<IndividualConfig>) {
    this.toastr.success(
      this.translate.instant(key),
      titleKey ? this.translate.instant(titleKey) : undefined,
      opts
    );
  }
  
  error(key: string, titleKey?: string, opts?: Partial<IndividualConfig>) {
    this.toastr.error(
      this.translate.instant(key),
      titleKey ? this.translate.instant(titleKey) : undefined,
      opts
    );
  }

  info(key: string, titleKey?: string, opts?: Partial<IndividualConfig>) {
    this.toastr.info(
      this.translate.instant(key),
      titleKey ? this.translate.instant(titleKey) : undefined,
      opts
    );
  }

  warning(key: string, titleKey?: string, opts?: Partial<IndividualConfig>) {
    this.toastr.warning(
      this.translate.instant(key),
      titleKey ? this.translate.instant(titleKey) : undefined,
      opts
    );
  }

  clear(toastId?: number): void {
    this.toastr.clear(toastId);
  }

  setOverlayContainer(container: ToastContainerDirective): void {
    this.toastr.overlayContainer = container;
  }

}
