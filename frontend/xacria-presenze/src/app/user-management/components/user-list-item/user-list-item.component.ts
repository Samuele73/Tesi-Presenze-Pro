import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserBasicDetailsResponse, UserEmailResponse, UserService } from 'src/generated-client';

@Component({
  selector: 'app-user-list-item',
  templateUrl: './user-list-item.component.html',
  styleUrls: ['./user-list-item.component.scss'],
})
export class UserListItemComponent implements OnInit {
  @Input() userBasicDetails: UserBasicDetailsResponse | null = null;
  fullName!: string;

  constructor(
    private router: Router,
    private userAuth: AuthService,
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  classMap: { [key: string]: string } = {
    OWNER: 'bg-secondary-subtle text-muted',
    USER: 'bg-secondary-subtle text-muted',
    ADMIN: 'bg-secondary-subtle text-muted',
  };

  roleMap: { [key: string]: string } = {
    ADMIN: 'Admin',
    USER: 'Utente',
    OWNER: 'Owner',
  };

  ngOnInit(): void {
    this.fullName =
      this.userBasicDetails?.name + ' ' + this.userBasicDetails?.surname;
  }

  handleCardClicked(): void {
    const loggedUserTkn: string | null = this.userAuth.token;
    if (!loggedUserTkn) {
      console.warn('Could not get token to go on user profile page');
      return;
    }
    this.userService.getEmailFromTkn(loggedUserTkn).subscribe({
      next: (resp: UserEmailResponse) => {
        this.goToUserProfileByEmailRole(resp.email);
      },
      error: (err: HttpErrorResponse) => {
        console.warn('could not get email from tkn to go to user profile', err);
      },
    });
  }

  private goToUserProfileByEmailRole(email?: string): void {
    const toGoUserEmail = this.userBasicDetails?.email
    if(!email || !toGoUserEmail){
      console.warn("could not retrieve email from tkn or to go to user email");
      return;
    }
    let params = { email: toGoUserEmail, mode: '' };
    if (email === this.userBasicDetails?.email) {
      this.router.navigate(['/app/profile'], {queryParams: {mode: 'ME'}});
      return;
    } else if (this.userAuth.isOwner()) params = { ...params, mode: 'FULL' };
    else params = {...params, mode: 'BASIC' };
    this.router.navigate(['./user-details'], {
      queryParams: params,
      relativeTo: this.route
    });
  }
}
