import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { APP_ROUTES } from 'src/app/shared/constants/route-paths';
import { AuthService } from 'src/app/shared/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CustomCalendarGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router){}


   canActivate(
      route: ActivatedRouteSnapshot,
      state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      if (!this.authService.isOwner()) {
        return true;
      }

      return this.router.createUrlTree([APP_ROUTES.HOME]);
    }

}
