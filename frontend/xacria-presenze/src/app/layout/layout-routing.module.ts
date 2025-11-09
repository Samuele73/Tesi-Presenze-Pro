import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from '../shared/components/profile/profile.component';
import { AttendanceComponent } from './calendar-comps/attendance/attendance.component';
import { ProjectPageComponent } from '../project/components/project-page/project-page.component';
import { DetailedProjectComponent } from '../project/components/detailed-project/detailed-project.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'home', pathMatch: 'full', component: HomeComponent },
      { path: 'profile', pathMatch: 'full', component: ProfileComponent },
      { path: 'calendar', pathMatch: 'full', component: AttendanceComponent },
      {
        path: 'projects',
        loadChildren: () =>
          import('../project/project.module').then((m) => m.ProjectModule),
      },
      {
        path: 'users-management',
        loadChildren: () =>
          import('../user-management/user-management.module').then(
            (m) => m.UserManagementModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {}
