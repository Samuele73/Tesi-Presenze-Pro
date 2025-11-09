import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserBasicDetailsResponse, UserService } from 'src/generated-client';

type invitationFeedback = {
  positive: boolean;
  message: string;
};

@Component({
  selector: 'app-user-list-interaction',
  templateUrl: './user-list-interaction.component.html',
  styleUrls: ['./user-list-interaction.component.scss'],
})
export class UserLisInteractionComponent implements OnChanges {
  searchTerm: string = '';
  addButtonName: string = 'Invita Utente';
  @Input() usersBasicDetails!: UserBasicDetailsResponse[];
  @Input() filteredUsersBasicDetails!: UserBasicDetailsResponse[];
  @Output() filteredUsersBasicDetailsChange = new EventEmitter<
    UserBasicDetailsResponse[]
  >();
  toInviteUserEmail: string = '';
  invitationFeedBack!: invitationFeedback | undefined;

  selectedRole: string[] = [];
  userRoles = [
    { value: 'USER', label: 'Utente' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'OWNER', label: 'Owner' },
  ];

  constructor(
    public authService: AuthService,
    private modalService: NgbModal,
    private userService: UserService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usersBasicDetails'] && this.usersBasicDetails) {
      this.filterUsersBasicDetails();
    }
  }

  createUserFullname(userName?: string, userSurname?: string): string {
    return (userName || '') + ' ' + (userSurname || '');
  }

  filterUsersBasicDetails(): void {
    const filtered = this.usersBasicDetails.filter(
      (userBasicDetails: UserBasicDetailsResponse) => {
        const matchesSearch = (
          this.createUserFullname(
            userBasicDetails?.name,
            userBasicDetails?.surname
          ).toLowerCase() || ''
        ).includes(this.searchTerm.toLowerCase());
        const matchesRole =
          this.selectedRole.length === 0 ||
          this.selectedRole.includes(userBasicDetails.role || '');
        return matchesSearch && matchesRole;
      }
    );

    this.filteredUsersBasicDetails = filtered;
    this.filteredUsersBasicDetailsChange.emit(filtered);
  }

  openInvitationModal(content: any): void {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' });
  }

  submitInviteUser(form: NgForm): void {

  if (form.invalid) {
    Object.values(form.controls).forEach(control => {
      control.markAsTouched();
    });
    return;
  }

  this.invitationFeedBack = undefined;

  this.userService.sendInvitationByEmail(this.toInviteUserEmail).subscribe({
    next: () => {
      this.invitationFeedBack = {
        positive: true,
        message: 'Utente invitato con successo',
      };
      form.resetForm();
    },
    error: (err: HttpErrorResponse) => {
      if (err.status == 409) {
        this.invitationFeedBack = {
          positive: false,
          message: 'Un utente con questa email esiste già',
        };
        return;
      }
      this.invitationFeedBack = {
        positive: false,
        message: 'Non è stato possibile recapitare l invito',
      };
    },
  });
}
}
