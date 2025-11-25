import { Component } from '@angular/core';
import { APP_ROUTES } from 'src/app/shared/constants/route-paths';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  styleUrls: ['./user-dropdown.component.scss']
})
export class UserDropdownComponent {
 APP_ROUTES = APP_ROUTES
}
