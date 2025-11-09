import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Username } from '../models/username';

@Injectable({
  providedIn: 'root'
})
export class UsernameService {
  private emitChangedUsername = new Subject<Username>;
  changedUsername = this.emitChangedUsername.asObservable();

  constructor() { }

  emitChange(newUsername: Username): void{
    if(newUsername!.name == null || newUsername!.surname == null){
      console.error("Errore nell'aggiornamento dell'username. Uno dei valori presentati è null o undefined");
      return;
    }
    this.emitChangedUsername.next(newUsername);
  }
}
