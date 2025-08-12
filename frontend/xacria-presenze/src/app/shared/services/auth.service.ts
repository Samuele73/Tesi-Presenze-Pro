import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, throwError } from 'rxjs';
import { UserCreds } from 'src/interfaces';
import { UserProfile, userCredentials } from '../models/userModel';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _isLoggedIn$ = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this._isLoggedIn$.asObservable();
  private readonly TOKEN_NAME: string = 'tkn';
  private userEmail: string = '';

  constructor(private apiService: ApiService, private router: Router) {
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
      this.apiService.validateToken(this.token).subscribe({
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
      return this.apiService.validateToken(this.token);
      //aggiornare user role
    }
    return;
  }

  getUserEmail() {
    const tkn = this.token;
    if (tkn) {
      return this.apiService.getEmailFromTkn(tkn);
    }
    return false;
  }

  login(userCredentials: userCredentials) {
    return this.apiService.loginUser(userCredentials).pipe(
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

  signin(userCredentials: userCredentials) {
    return this.apiService.signInUser(userCredentials).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 0) {
          console.error('Client side or Network error occurred:', err.error);
        } else if (err.status === 409) {
          console.error('Email already exists:', err.error);
          // Qui puoi fare qualcosa di specifico, tipo notificare l'utente
          return throwError(() => new Error('Email already registered'));
        } else {
          console.error('Server side error occurred:', err.error);
        }
        return throwError(() => new Error('Cannot sign in user!'));
      })
    );
  }

  changePassword(email: string) {
    return this.apiService.changeUserPassword(email);
  }

  updatePassword(newPasswordRequest: object) {
    return this.apiService.updatePassword(newPasswordRequest);
  }

  retrieveCreds() {
    if (!this.token) {
      console.error('Impossibile reperire token nel local storage!');
      return null;
    }
    return this.apiService.retrieveUserCreds(this.token);
  }

  updateCreds(user_creds: UserProfile) {
    return this.apiService.updateUserCreds(user_creds);
  }
}
