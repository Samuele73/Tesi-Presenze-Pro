import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class IsAuthenticatedGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    const check$ = this.authService.checkUserAutentication2();

    if (!check$) {
      this.router.navigate(['login']);
      return of(false);
    }

    return check$.pipe(
      catchError(() => {
        this.router.navigate(['login']);
        return of(false);
      }),
      map((isLoggedIn: any) => {
        if (!isLoggedIn) {
          this.router.navigate(['login']);
          return false;
        }
        this.authService.email = isLoggedIn.email;
        return true;
      })
    );
  }
}
