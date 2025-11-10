import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../shared/services/auth.service';
import { APP_ROUTES } from '../../../../shared/constants/route-paths';

@Injectable({
  providedIn: 'root'
})
export class RequestsApprovalGuard implements CanActivate {
  APP_ROUTES = APP_ROUTES

  constructor(private authService: AuthService, private router: Router){}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.isPrivilegedUser()) {
      return true;
    }

    return this.router.createUrlTree([APP_ROUTES.HOME]);
  }

}
