import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomCalendarPageComponent } from './components/custom-calendar-page/custom-calendar-page.component';

const routes: Routes = [
  {path: '', component: CustomCalendarPageComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomCalendarRoutingModule { }
