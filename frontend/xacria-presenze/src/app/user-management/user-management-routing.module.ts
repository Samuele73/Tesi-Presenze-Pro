import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserManagementPageComponent } from './components/user-management-page/user-management-page.component';

const routes: Routes = [
  {path: '', component: UserManagementPageComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserManagementRoutingModule { }
