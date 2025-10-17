import { Component, Input } from '@angular/core';
import { Username } from '../shared/models/username';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-profile-menu',
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.scss']
})
export class ProfileMenuComponent {
  name!: string;
  surname!: string;
  @Input() username!: Username;

  constructor(public authService: AuthService){
    console.log("USERNAEM: ", this.username)
  }
}
