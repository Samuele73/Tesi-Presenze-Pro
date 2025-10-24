import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { LayoutRoutingModule } from './layout-routing.module';
import { GeneralModule } from '../shared/modules/general/general.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
import { NgbDatepickerModule, NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './home/home.component';
import { NavbarComponent } from './navbar/navbar.component';
import { httpTranslateLoader } from '../app.module';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ProfileMenuComponent } from './profile-menu/profile-menu.component';
import { RequestsListComponent } from './requests-list/requests-list.component';
import { ProfileComponent } from './profile/profile.component';
import { AttendanceComponent } from './calendar-comps/attendance/attendance.component';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { DayCellNotifComponent } from './calendar-comps/day-cell-notif/day-cell-notif.component';
import { DayworkModalComponent } from './calendar-comps/modals/daywork-modal/daywork-modal.component';
import { WorkingTripModalComponent } from './calendar-comps/modals/working-trip-modal/working-trip-modal.component';
import { AvailabilityModalComponent } from './calendar-comps/modals/availability-modal/availability-modal.component';
import { RequestModalComponent } from './calendar-comps/modals/request-modal/request-modal.component';
import { InteractiveButtonComponent } from './calendar-comps/interactive-button/interactive-button.component';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { ProjectPageComponent } from './project-comps/project-page/project-page.component';import { FilterPipe } from './shared/pipes/filter.pipe';
import { ProjectListComponent } from './project-comps/project-list/project-list.component';
import { ProjectListItemComponent } from './project-comps/project-list-item/project-list-item.component';
import { ProjectListFiltersComponent } from './project-comps/project-list-filters/project-list-filters.component';
import { AssignmentBadgesComponent } from './project-comps/assignment-badges/assignment-badges.component';
;


@NgModule({
  declarations: [
    LayoutComponent,
    HomeComponent,
    NavbarComponent,
    SidebarComponent,
    ProfileMenuComponent,
    RequestsListComponent,
    ProfileComponent,
    AttendanceComponent,
    DayCellNotifComponent,
    DayworkModalComponent,
    WorkingTripModalComponent,
    AvailabilityModalComponent,
    RequestModalComponent,
    InteractiveButtonComponent,
    StatusBadgeComponent,
    ProjectPageComponent,
    FilterPipe,
    ProjectListComponent,
    ProjectListItemComponent,
    ProjectListFiltersComponent,
    AssignmentBadgesComponent
  ],
  imports: [
    CommonModule,
    LayoutRoutingModule,
    GeneralModule,
    FormsModule,
    ReactiveFormsModule,
    FullCalendarModule,
    FontAwesomeModule,
    NgbModalModule,
    NgbTooltipModule,
    NgbDatepickerModule,
    TranslateModule.forChild({
        loader: {
            provide: TranslateLoader,
            useFactory: httpTranslateLoader,
            deps: [HttpClient]
        },
        extend: true
    }),
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
  ]
})
export class LayoutModule { }
