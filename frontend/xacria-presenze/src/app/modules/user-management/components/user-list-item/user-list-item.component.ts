import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from 'src/app/modules/layout/confirm-modal/confirm-modal.component';
import { DropdownOptions } from 'src/app/shared/components/ngb-options/ngb-options.component';
import { APP_ROUTES } from 'src/app/shared/constants/route-paths';
import { AuthService } from 'src/app/shared/services/auth.service';
import {
  User,
  UserBasicDetailsResponse,
  UserEmailResponse,
  UserService,
} from 'src/generated-client';

@Component({
  selector: 'app-user-list-item',
  templateUrl: './user-list-item.component.html',
  styleUrls: ['./user-list-item.component.scss'],
})
export class UserListItemComponent implements OnInit {
  APP_ROUTES = APP_ROUTES
  @Input() userBasicDetails: UserBasicDetailsResponse | null = null;
  @Output() deleted = new EventEmitter<void>();
  fullName!: string;
  apiError: string = '';
  itemOptions: DropdownOptions = [
    { name: 'Elimina', onclick: () => this.openConfirmDeletionModal() },
  ];

  constructor(
    private router: Router,
    public userAuth: AuthService,
    private userService: UserService,
    private route: ActivatedRoute,
    private modalService: NgbModal
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

  deleteUser() {
    console.log("controlla di nuovo", this.userBasicDetails?.email, !this.userBasicDetails?.email || !this.userAuth.isOwner());
    if (!this.userBasicDetails?.email || !this.userAuth.isOwner()) {
      this.apiError = 'Impossibile eliminare l utente';
      return;
    }
    console.log("e invece ecccomi")
    this.userService.deleteUserByEmail(this.userBasicDetails?.email).subscribe({
      next: (deletedUser: User) => {
        console.log("Delted user: ", deletedUser)
        this.deleted.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.apiError = err.error.message;
      }
    })
  }

  openConfirmDeletionModal() {
    console.log("Controllasdafadsfsfa")
    const modalRef = this.modalService.open(ConfirmModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.title = 'Conferma eliminazione!';
    modalRef.componentInstance.message =
      'Sei sicuro di voler eliminare questo utente? Questa azione non può essere annullata.';
    modalRef.componentInstance.mode = 'DELETE';
    modalRef.componentInstance.confirm.subscribe(() => {
      this.deleteUser();
    });
  }

  private goToUserProfileByEmailRole(email?: string): void {
    const toGoUserEmail = this.userBasicDetails?.email;
    if (!email || !toGoUserEmail) {
      console.warn('could not retrieve email from tkn or to go to user email');
      return;
    }
    let params = { email: toGoUserEmail, mode: '' };
    if (email === this.userBasicDetails?.email) {
      this.router.navigate([APP_ROUTES.PROFILE], { queryParams: { mode: 'ME' } });
      return;
    } else if (this.userAuth.isOwner()) params = { ...params, mode: 'FULL' };
    else params = { ...params, mode: 'BASIC' };
    this.router.navigate([APP_ROUTES.USERS.DETAILS], {
      queryParams: params,
      relativeTo: this.route,
    });
  }
}
