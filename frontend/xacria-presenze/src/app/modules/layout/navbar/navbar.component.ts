import { Component } from '@angular/core';
import { APP_ROUTES } from 'src/app/shared/constants/route-paths';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
 APP_ROUTES = APP_ROUTES
}
