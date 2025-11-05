import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { User, UserBasicDetailsResponse, UserService } from 'src/generated-client';

@Component({
  selector: 'app-user-management-page',
  templateUrl: './user-management-page.component.html',
  styleUrls: ['./user-management-page.component.scss'],
})
export class UserManagementPageComponent implements OnInit {
  usersBasicDetails: UserBasicDetailsResponse[] = [];
  filteredUsersBasicDetails: UserBasicDetailsResponse[] = [];
  errorResponseMessage: string | null = null;
  isLoading: boolean = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsersBasicDetails();
  }

  loadUsersBasicDetails(): void{
    this.isLoading = true
    this.userService.getUsersBasicDetails().subscribe({
      next: (resp: UserBasicDetailsResponse[]) => {
        this.usersBasicDetails = resp;
      },
      error: (err: HttpErrorResponse) => {
        console.warn('Could not fetch Users basi details', err)
        this.errorResponseMessage = err.error.message
      },
      complete: () => {
        this.isLoading = false;
      }
    })
  }

  openInvitationModal() {}
}
