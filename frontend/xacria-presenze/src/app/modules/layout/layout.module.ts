import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { LayoutRoutingModule } from './layout-routing.module';
import { GeneralModule } from '../../shared/modules/general/general.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClient } from '@angular/common/http';
import {
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbModalModule,
  NgbTooltipModule,
  NgbCollapse,
  NgbActiveModal,
} from '@ng-bootstrap/ng-bootstrap';

import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './home/home.component';
import { NavbarComponent } from './navbar/navbar.component';
import { httpTranslateLoader } from '../../app.module';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ProfileMenuComponent } from './profile-menu/profile-menu.component';
import { RequestsListComponent } from './requests-list/requests-list.component';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { ProjectPageComponent } from '../project/components/project-page/project-page.component';
import { FilterPipe } from './shared/pipes/filter.pipe';
import { ProjectListComponent } from '../project/components/project-list/project-list.component';
import { ProjectListItemComponent } from '../project/components/project-list-item/project-list-item.component';
import { ProjectListInteractionComponent } from '../project/components/project-list-interaction/project-list-interaction.component';
import { AssignmentBadgesComponent } from '../project/components/assignment-badges/assignment-badges.component';
import { DetailedProjectComponent } from '../project/components/detailed-project/detailed-project.component';
import { ProjectStatusComponent } from '../project/components/project-status/project-status.component';
import { ChipsComponent } from './chips/chips.component';
import { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';
import { ProjectFormComponent } from '../project/components/project-form/project-form.component';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { SidebarItemComponent } from './sidebar-item/sidebar-item.component';
import { ProfileMenuItemComponent } from './profile-menu-item/profile-menu-item.component';
import { ToastContainerModule, ToastrModule } from 'ngx-toastr';
import { StatComponent } from './stat/stat.component';
import { RequestsPreviewComponent } from './requests-preview/requests-preview.component';
import { NotificationComponent } from './notification/notification.component';

@NgModule({
  declarations: [
    LayoutComponent,
    HomeComponent,
    NavbarComponent,
    SidebarComponent,
    ProfileMenuComponent,
    RequestsListComponent,
    ProjectPageComponent,
    FilterPipe,
    ProjectListComponent,
    ProjectListItemComponent,
    ProjectListInteractionComponent,
    AssignmentBadgesComponent,
    DetailedProjectComponent,
    ProjectStatusComponent,
    ChipsComponent,
    ConfirmModalComponent,
    ProjectFormComponent,
    SidebarItemComponent,
    ProfileMenuItemComponent,
    StatComponent,
    RequestsPreviewComponent,
    NotificationComponent
  ],
  imports: [
    CommonModule,
    LayoutRoutingModule,
    GeneralModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    NgbModalModule,
    NgbTooltipModule,
    NgbDropdownModule,
    DropdownModule,
    MultiSelectModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: httpTranslateLoader,
        deps: [HttpClient],
      },
      extend: true,
    }),
    ToastrModule,
    ToastContainerModule
  ],
  providers: [NgbActiveModal]
})
export class LayoutModule {}
