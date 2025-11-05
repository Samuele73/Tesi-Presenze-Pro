import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-profile-menu-item',
  templateUrl: './profile-menu-item.component.html',
  styleUrls: ['./profile-menu-item.component.scss']
})
export class ProfileMenuItemComponent {
  @Input() name!: string;
  @Input() route!: string;
  @Input() queryParams?: {[key: string] : string};
}
