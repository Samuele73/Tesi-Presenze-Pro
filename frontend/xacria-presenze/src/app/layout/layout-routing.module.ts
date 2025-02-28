import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { AttendanceComponent } from './calendar-comps/attendance/attendance.component';

const routes: Routes = [
  {path: "", redirectTo: "home", pathMatch: "full"},
  {
    path: "",
    component: LayoutComponent,
    children: [
      {path: "home", pathMatch: "full", component: HomeComponent},
      {path: "profile", pathMatch: "full", component: ProfileComponent},
      {path: "attendance", pathMatch: "full", component: AttendanceComponent}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule { }
