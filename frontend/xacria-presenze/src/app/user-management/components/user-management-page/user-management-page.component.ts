import { Component } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-user-management-page',
  templateUrl: './user-management-page.component.html',
  styleUrls: ['./user-management-page.component.scss']
})
export class UserManagementPageComponent {
  public searchTerm: string = '';
  public addButtonName: string = 'Aggiungi Utente'

  constructor(public authService: AuthService){}

  openInvitationModal(){

  }
}
