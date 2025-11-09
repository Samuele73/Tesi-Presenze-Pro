import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectRoutingModule } from './project-routing.module';
import { GeneralModule } from '../../shared/modules/general/general.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { httpTranslateLoader } from '../../app.module';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarCommonModule } from 'angular-calendar';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ProjectRoutingModule,
    GeneralModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpTranslateLoader,
        deps: [HttpClient],
      },
      extend: true,
    }),
    FormsModule,
    MultiSelectModule,
    CalendarCommonModule
  ],
})
export class ProjectModule {}
