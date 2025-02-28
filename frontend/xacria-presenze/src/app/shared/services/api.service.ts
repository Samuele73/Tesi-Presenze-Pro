import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http'
import { UserCreds } from 'src/interfaces';
import { UserProfile, userCredentials } from '../models/userModel';
import { apiEntry, entryType } from 'src/app/layout/shared/services/attendance-controller.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private API_URL: string = "http://localhost:8080";

  constructor(private httpClient: HttpClient) {}

  loginUser(userCredentials: userCredentials): any{
    return this.httpClient.post(this.API_URL + "/users/login", userCredentials);
  }

  signInUser(userCredentials: userCredentials){
    this.httpClient.post(this.API_URL + "/users/signin", userCredentials).subscribe(
      resp => {
        console.log("API RESPONSE", resp);
      }
    );
  }

  changeUserPassword(email: string){
    return this.httpClient.post(this.API_URL + "/users/resetPassword", email);
  }

  updatePassword(newPasswordRequest: object){
    return this.httpClient.post(this.API_URL + "/users/savePassword", newPasswordRequest);
  }

  retrieveUserCreds(token: string){
    return this.httpClient.post(this.API_URL + "/users/profile", token);
  }

  updateUserCreds(user_creds: UserProfile){
    console.log("Le credenziali NUOVE SONO:", user_creds);
    return this.httpClient.put(this.API_URL + "/users/profile/update", user_creds);
    localStorage.setItem("user_creds", JSON.stringify(user_creds));
  }

  validateToken(token: any){
    const headers: HttpHeaders = new HttpHeaders({
      Authorization: "Bearer " + token
    });
    return this.httpClient.post(this.API_URL + "/users/secure", token, {headers: headers});
  }

  getEmailFromTkn(token: string){
    const headers: HttpHeaders = new HttpHeaders({
      Authorization: "Bearer " + token
    });
    return this.httpClient.post(this.API_URL + "/users/getEmail", token, {headers: headers});
  }

  retrieveCalendarEntries(token: string){
    const headers: HttpHeaders = new HttpHeaders({
      Authorization: "Bearer " + token
    });
    return this.httpClient.get<apiEntry[]>(this.API_URL + "/calendar/retrieveAll", {headers: headers});
  }

  modifyCalendarEntries(to_modify_entries: {old_entry: any, new_entry: any}[], entries_type: entryType, token: string){
    const headers: HttpHeaders = new HttpHeaders({
      Authorization: "Bearer " + token
    });
    console.log("Mando la richiesta di modifica", token);
    return this.httpClient.put<apiEntry[]>(this.API_URL + "/calendar/modifyEntries", {headers: headers});
  }
}

