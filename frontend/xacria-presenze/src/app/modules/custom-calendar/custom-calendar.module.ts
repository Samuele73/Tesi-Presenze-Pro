import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomCalendarRoutingModule } from './custon-calendar-routing.module';
import { GeneralModule } from 'src/app/shared/modules/general/general.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { httpTranslateLoader } from 'src/app/app.module';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarCommonModule, DateAdapter } from 'angular-calendar';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  NgbCollapse,
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbModalModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { DropdownModule } from 'primeng/dropdown';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CalendarModule } from 'angular-calendar';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CustomCalendarRoutingModule,
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
    CalendarCommonModule,
    ReactiveFormsModule,
    FullCalendarModule,
    FontAwesomeModule,
    NgbModalModule,
    NgbTooltipModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    DropdownModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    NgbCollapse,
  ],
})
export class CustomCalendarModule {}
