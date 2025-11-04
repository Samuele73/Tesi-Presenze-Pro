import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserManagementRoutingModule } from './user-management-routing.module';
import { UserManagementPageComponent } from './components/user-management-page/user-management-page.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { GeneralModule } from '../shared/modules/general/general.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { httpTranslateLoader } from '../app.module';
import { HttpClient } from '@angular/common/http';

@NgModule({
  declarations: [UserManagementPageComponent, UserListComponent],
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
  ],
})
export class UserManagementModule {}
