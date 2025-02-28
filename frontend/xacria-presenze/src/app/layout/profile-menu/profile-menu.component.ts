import { Component, Input } from '@angular/core';
import { Username } from '../shared/models/username';

@Component({
  selector: 'app-profile-menu',
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.scss']
})
export class ProfileMenuComponent {
  name!: string;
  surname!: string;
  @Input() username!: Username;

  constructor(){
    console.log("USERNAEM: ", this.username)
  }
}
