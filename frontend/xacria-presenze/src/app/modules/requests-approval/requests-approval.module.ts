import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModalModule, NgbNavModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { RequestsApprovalRoutingModule } from './requests-approval-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarCommonModule } from 'angular-calendar';
import { GeneralModule } from 'src/app/shared/modules/general/general.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { httpTranslateLoader } from 'src/app/app.module';
import { HttpClient } from '@angular/common/http';
import { RequestsApprovalPageComponent } from './components/requests-approval-page/requests-approval-page.component';
import { RequestsTableComponent } from './components/requests-table/requests-table.component';
import { DynamicTableComponent } from './components/dynamic-table/dynamic-table.component';
import { RequestDetailsModalComponent } from './components/request-details-modal/request-details-modal.component';

@NgModule({
  declarations: [
    RequestsApprovalPageComponent,
    RequestsTableComponent,
    DynamicTableComponent,
    RequestDetailsModalComponent,
  ],
  imports: [
    CommonModule,
    RequestsApprovalRoutingModule,
    FormsModule,
    MultiSelectModule,
    CalendarCommonModule,
    GeneralModule,
    NgbNavModule,
    NgbPaginationModule,
    TranslateModule.forChild({
        loader: {
            provide: TranslateLoader,
            useFactory: httpTranslateLoader,
            deps: [HttpClient],
        },
        extend: true,
    }),
    NgbModalModule,
    ReactiveFormsModule
],
})
export class RequestsApprovalModule {}
