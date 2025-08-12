import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { UserCreds } from 'src/interfaces';
import { UserProfile, userCredentials } from '../models/userModel';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private API_URL: string = environment.apiUrl;

  constructor(private httpClient: HttpClient) {}

  loginUser(userCredentials: userCredentials): any {
    return this.httpClient.post(this.API_URL + '/users/login', userCredentials);
  }

  signInUser(userCredentials: userCredentials) {
    this.httpClient
      .post(this.API_URL + '/users/signin', userCredentials)
      .subscribe((resp) => {
        console.log('API RESPONSE', resp);
      });
  }

  changeUserPassword(email: string) {
    return this.httpClient.post(this.API_URL + '/users/resetPassword', email);
  }

  updatePassword(newPasswordRequest: object) {
    return this.httpClient.post(
      this.API_URL + '/users/savePassword',
      newPasswordRequest
    );
  }

  retrieveUserCreds(token: string) {
    return this.httpClient.post(this.API_URL + '/users/profile', token);
  }

  updateUserCreds(user_creds: UserProfile) {
    console.log('Le credenziali NUOVE SONO:', user_creds);
    return this.httpClient.put(
      this.API_URL + '/users/profile/update',
      user_creds
    );
    localStorage.setItem('user_creds', JSON.stringify(user_creds));
  }

  validateToken(token: any) {
    return this.httpClient.post(this.API_URL + '/users/secure', token);
  }

  getEmailFromTkn(token: string) {
    return this.httpClient.post(this.API_URL + '/users/getEmail', token);
  }
}
