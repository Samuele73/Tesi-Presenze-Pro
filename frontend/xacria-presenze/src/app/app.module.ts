import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  HttpClientModule,
  HttpClient,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { GeneralModule } from './shared/modules/general/general.module';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { AuthLinkComponent } from './auth-link/auth-link.component';
import { FormErrorComponent } from './form-error/form-error.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { ForgottenPwComponent } from './forgotten-pw/forgotten-pw.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { UpdatePwComponent } from './update-pw/update-pw.component';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthInterceptor } from './shared/interceptors/auth.interceptor';
import { ApiModule } from 'src/generated-client';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InvitationErrorComponent } from './invitation-error/invitation-error.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AuthLinkComponent,
    SignInComponent,
    ForgottenPwComponent,
    NotfoundComponent,
    UpdatePwComponent,
    InvitationErrorComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    GeneralModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpTranslateLoader,
        deps: [HttpClient],
      },
    }),
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    FontAwesomeModule,
    ApiModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

// AOT compilation support
export function httpTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
