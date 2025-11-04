import { Injectable } from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { UserService } from 'src/generated-client';

@Injectable({
  providedIn: 'root',
})
export class SigninInvitationGuard implements CanActivate {
  constructor(
    private router: Router,
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const token: string = route.queryParams['token'];
    if (!token) {
      return of(
        this.router.createUrlTree(['/invitation-error'], {
          queryParams: { reason: 'missing-token' },
        })
      );
    }

    return true;
  }
}
