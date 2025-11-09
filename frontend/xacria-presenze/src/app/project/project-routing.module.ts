import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectPageComponent } from './components/project-page/project-page.component';
import { DetailedProjectComponent } from './components/detailed-project/detailed-project.component';

const routes: Routes = [
  {path: '', component: ProjectPageComponent},
  {path: 'details', component: DetailedProjectComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectRoutingModule { }
