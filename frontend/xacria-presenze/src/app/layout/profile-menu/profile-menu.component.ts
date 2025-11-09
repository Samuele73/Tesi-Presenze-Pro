import { Component, Input } from '@angular/core';
import { Username } from '../shared/models/username';
import { AuthService } from 'src/app/shared/services/auth.service';
import { APP_ROUTES } from 'src/app/shared/constants/route-paths';

@Component({
  selector: 'app-profile-menu',
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.scss']
})
export class ProfileMenuComponent {
  APP_ROUTES = APP_ROUTES
  name!: string;
  surname!: string;
  @Input() username!: Username;

  classMap: { [key: string]: string } = {
    OWNER: 'bg-warning',
    USER: 'bg-secondary',
    ADMIN: 'bg-primary',
  };

  roleMap: { [key: string]: string } = {
    ADMIN: 'Admin',
    USER: 'Utente',
    OWNER: 'Owner',
  };

  constructor(public authService: AuthService){
    console.log("USERNAEM: ", this.username)
  }
}
