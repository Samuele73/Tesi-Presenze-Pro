import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { ForgottenPwComponent } from './forgotten-pw/forgotten-pw.component';
import { IsAuthenticatedGuard } from './shared/guards/is-authenticated.guard';
import { NotfoundComponent } from './notfound/notfound.component';
import { UpdatePwComponent } from './update-pw/update-pw.component';

const routes: Routes = [
  {path: "login", component: LoginComponent},
  {path: "signin", component: SignInComponent},
  {path: "forgotten-pw", component: ForgottenPwComponent},
  {path: "updatePassword", component: UpdatePwComponent},
  {path: "", pathMatch: "full", redirectTo: "/app/home"},
  {path: "app", pathMatch: "prefix", loadChildren: (() => import("./layout/layout.module").then((module) => module.LayoutModule)), canActivate: [IsAuthenticatedGuard]},
  {path: "**", component: NotfoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
