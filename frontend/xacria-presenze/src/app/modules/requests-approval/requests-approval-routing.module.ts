import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RequestsApprovalPageComponent } from './components/requests-approval-page/requests-approval-page.component';

const routes: Routes = [
  {path: '', component: RequestsApprovalPageComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RequestsApprovalRoutingModule { }
