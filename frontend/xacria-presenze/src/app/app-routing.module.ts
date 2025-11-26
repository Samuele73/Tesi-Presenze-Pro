import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { ForgottenPwComponent } from './forgotten-pw/forgotten-pw.component';
import { IsAuthenticatedGuard } from './shared/guards/is-authenticated.guard';
import { NotfoundComponent } from './notfound/notfound.component';
import { UpdatePwComponent } from './update-pw/update-pw.component';
import { SigninInvitationGuard } from './shared/guards/singin-invitation.guard';
import { InvitationErrorComponent } from './invitation-error/invitation-error.component';

const routes: Routes = [
  {path: "login", component: LoginComponent},
  {path: "signin", component: SignInComponent, canActivate: [SigninInvitationGuard]},
  {path: "invitation-error", component: InvitationErrorComponent},
  {path: "forgotten-pw", component: ForgottenPwComponent},
  {path: "changePassword", component: UpdatePwComponent},
  {path: "", pathMatch: "full", redirectTo: "/app/home"},
  {path: "app", pathMatch: "prefix", loadChildren: (() => import("./modules/layout/layout.module").then((module) => module.LayoutModule)), canActivate: [IsAuthenticatedGuard]},
  {path: "**", component: NotfoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
