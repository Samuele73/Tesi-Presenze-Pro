import { Component } from '@angular/core';
import { faUser, faUsers, faDiagramProject, faCalendar, faHouse, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from 'src/app/shared/services/auth.service';
import { APP_ROUTES } from 'src/app/shared/constants/route-paths';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  APP_ROUTES = APP_ROUTES;
  constructor(public authService: AuthService){}

  faUsers = faUsers;
  faUser = faUser;
  faDiagramProject = faDiagramProject;
  faCalendar = faCalendar;
  faHouse = faHouse;
  faClipboardList = faClipboardList
}
