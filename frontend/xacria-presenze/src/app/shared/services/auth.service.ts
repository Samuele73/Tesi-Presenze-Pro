import { Injectable } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { LoginRequestDto, NewPasswordDto, SignInRequestDto, User, UserService } from 'src/generated-client';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _isLoggedIn$ = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this._isLoggedIn$.asObservable();
  private readonly TOKEN_NAME: string = 'tkn';
  private userEmail: string = '';

  constructor(private userService: UserService, private router: Router) {
    /* this.checkUserAutentication(this.token); se si hanno problemi controlla*/
  }

  get token() {
    return localStorage.getItem(this.TOKEN_NAME);
  }
  get email() {
    return this.userEmail;
  }
  set email(email: string) {
    this.userEmail = email;
  }

  checkUserAutentication(token: string | null): void {
    /* this._isLoggedIn$.next(false); */
    let isTokenValid: boolean = false;
    console.log('Token from ls:', this.token, this._isLoggedIn$);
    if (token) {
      console.log('ci sono');
      this.userService.validToken(this.token!!).subscribe({
        next: (resp: any) => {
          console.log('tkn resp: ', resp, this._isLoggedIn$);
          isTokenValid = resp;
          this._isLoggedIn$.next(true);
          localStorage.setItem(
            'user_status',
            JSON.stringify({ isLogged: true })
          );
          console.log('tkn resp22222: ', this._isLoggedIn$.value);
        },
        error: (err: any) => {
          console.error('Error from user tkn validation');
          this._isLoggedIn$.next(false);
          this.router.navigate(['login']);
        },
      });
      //aggiornare user role
    }
    /* this._isLoggedIn$.next(isTokenValid); */
  }

  //Metodo corretto per l'autenticazione
  checkUserAutentication2() {
    if (this.token) {
      return this.userService.validToken(this.token!!);
      //aggiornare user role
    }
    return;
  }

  getUserEmail() {
    const tkn = this.token;
    if (tkn) {
      return this.userService.getEmailFromTkn(tkn);
    }
    return false;
  }

  login(userCredentials: LoginRequestDto) {
    return this.userService.login(userCredentials).pipe(
      tap((resp: any) => {
        console.log('Login TAP: ', resp);
        if (resp) {
          localStorage.setItem(this.TOKEN_NAME, resp.token);
          this._isLoggedIn$.next(true);
          //Estrarre user role da token;
        }
      })
    );
  }

  signin(userCredentials: SignInRequestDto) {
    return this.userService
      .signIn(userCredentials)
      .pipe(catchError(this.handleSigninError));
  }

  private handleSigninError(err: HttpErrorResponse) {
    if (err.status === 0) {
      console.error('Client side or Network error occurred:', err.error);
    } else if (err.status === 409) {
      console.error('Email already exists:', err);
      return throwError(() => new Error("Email già esistente"));
    } else {
      console.error('Server side error occurred:', err.error);
    }
    return throwError(() => new Error('Errore con la registrazione dell utente'));
  }

  changePassword(email: string) {
    return this.userService.resetPassword(email);
  }

  updatePassword(newPasswordRequest: NewPasswordDto) {
    return this.userService.saveNewPassword(newPasswordRequest);
  }

  getUserProfile() {
    return this.userService.getUserProfile();
  }

  updateCreds(user_creds: User) {
    return this.userService.updateUserProfile(user_creds);
  }
}
