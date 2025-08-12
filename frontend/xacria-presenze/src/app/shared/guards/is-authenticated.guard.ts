import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class IsAuthenticatedGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router){}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.checkUserAutentication2()!.pipe(
      catchError((err: any) => {
        this.router.navigate(["login"]); //Controllare meglio
        throw "Errore nell'autenticazione del token dell'utente";
      }),
      map((isLoggedIn: any) => {
        console.log("isloggedin", isLoggedIn);
        if(!isLoggedIn){
          console.log("User is not autheticated!")
          this.router.navigate(["login"]);
          return false;
        }
        this.authService.email = isLoggedIn.email;
        return true;
      })
    );
  }

}
