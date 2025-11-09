import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { ApiError } from 'src/app/shared/models/api-error.models';
import { AuthService } from 'src/app/shared/services/auth.service';
import {
  User,
  UserBasicDetailsResponse,
  UserService,
} from 'src/generated-client';

@Injectable({
  providedIn: 'root',
})
export class UserBasicDetailsStoreService {
  private UserBasicDetailsSubject: BehaviorSubject<
    UserBasicDetailsResponse[]
  > = new BehaviorSubject<UserBasicDetailsResponse[]>([]);
  private apiErrorSubject: BehaviorSubject<ApiError | null> =
    new BehaviorSubject<ApiError | null>(null);
  private isLoadingSubject: BehaviorSubject<boolean | null> =
    new BehaviorSubject<boolean | null>(null);

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  get basicUsers$() {
    return this.UserBasicDetailsSubject.asObservable();
  }
  get apiError$() {
    return this.apiErrorSubject.asObservable();
  }
  get isLoading$() {
    return this.isLoadingSubject.asObservable();
  }

  loadUsersBasicDetails(): void {
    this.isLoadingSubject.next(true);
    this.userService.getUsersBasicDetails().subscribe({
      next: (resp: UserBasicDetailsResponse[]) => {
        this.UserBasicDetailsSubject.next(resp);
        this.apiErrorSubject.next(null);
      },
      error: (err: HttpErrorResponse) => {
        console.warn('Could not fetch Users basi details', err);
        this.apiErrorSubject.next({
          error: err.error.message,
          op: 'GET',
        });
      },
      complete: () => this.isLoadingSubject.next(false),
    });
  }

  deleteUser(userEmail: string): Observable<boolean> {
  return this.userService.deleteUserByEmail(userEmail).pipe(
    tap((deletedUser: User) => {
      console.log("Delted user: ", deletedUser);
      const updatedUsers = this.UserBasicDetailsSubject.value.filter(
        (u) => u.email !== userEmail
      );
      this.UserBasicDetailsSubject.next(updatedUsers);
      this.apiErrorSubject.next(null);
    }),
    map(() => true),
    catchError((err: HttpErrorResponse) => {
      this.apiErrorSubject.next(err.error.message);
      return of(false);
    })
  );
}
}
