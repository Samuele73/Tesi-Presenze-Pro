import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserManagementRoutingModule } from './user-management-routing.module';
import { UserManagementPageComponent } from './components/user-management-page/user-management-page.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { GeneralModule } from '../shared/modules/general/general.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { httpTranslateLoader } from '../app.module';
import { HttpClient } from '@angular/common/http';
import { UserLisInteractionComponent } from './components/user-list-interaction/user-list-interaction.component';
import { UserListItemComponent } from './components/user-list-item/user-list-item.component';
import { MultiSelectModule } from 'primeng/multiselect';
import { UserDetailsComponent } from './components/user-details/user-details.component';

@NgModule({
  declarations: [UserManagementPageComponent, UserListComponent, UserLisInteractionComponent, UserListItemComponent, UserDetailsComponent],
  imports: [
    CommonModule,
    UserManagementRoutingModule,
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
    MultiSelectModule
  ],
})
export class UserManagementModule {}
