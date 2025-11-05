import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserBasicDetailsResponse } from 'src/generated-client';

@Component({
  selector: 'app-user-list-interaction',
  templateUrl: './user-list-interaction.component.html',
  styleUrls: ['./user-list-interaction.component.scss'],
})
export class UserLisInteractionComponent implements OnChanges {
  searchTerm: string = '';
  addButtonName: string = 'Aggiungi Utente';
  @Input() usersBasicDetails!: UserBasicDetailsResponse[];
  @Input() filteredUsersBasicDetails!: UserBasicDetailsResponse[];
  @Output() filteredUsersBasicDetailsChange = new EventEmitter<
    UserBasicDetailsResponse[]
  >();

  constructor(public authService: AuthService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usersBasicDetails'] && this.usersBasicDetails) {
      this.filterUsersBasicDetails();
    }
  }

  createUserFullname(userName?: string, userSurname?: string): string {
    return (userName || '') + ' ' + (userSurname || '');
  }

  filterUsersBasicDetails(): void {
    const filtered = this.usersBasicDetails.filter((userBasicDetails: UserBasicDetailsResponse) => {
      const matchesSearch = (this.createUserFullname(userBasicDetails?.name, userBasicDetails?.surname).toLowerCase() || '').includes(
        this.searchTerm.toLowerCase()
      );
      return matchesSearch;
    });

    this.filteredUsersBasicDetails = filtered;
    this.filteredUsersBasicDetailsChange.emit(filtered);
  }

  openInvitationModal(): void {}
}
