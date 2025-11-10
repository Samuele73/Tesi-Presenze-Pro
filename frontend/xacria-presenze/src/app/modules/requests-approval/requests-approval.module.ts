import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RequestsApprovalRoutingModule } from './requests-approval-routing.module';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarCommonModule } from 'angular-calendar';
import { GeneralModule } from 'src/app/shared/modules/general/general.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { httpTranslateLoader } from 'src/app/app.module';
import { HttpClient } from '@angular/common/http';
import { RequestsApprovalPageComponent } from './components/requests-approval-page/requests-approval-page.component';

@NgModule({
  declarations: [
    RequestsApprovalPageComponent
  ],
  imports: [
    CommonModule,
    RequestsApprovalRoutingModule,
    FormsModule,
    MultiSelectModule,
    CalendarCommonModule,
    GeneralModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpTranslateLoader,
        deps: [HttpClient],
      },
      extend: true,
    }),
  ],
})
export class RequestsApprovalModule {}
