import { Component } from '@angular/core';
import { faUser, faUsers, faDiagramProject, faCalendar, faHouse } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {

  constructor(public authService: AuthService){}

  faUsers = faUsers;
  faUser = faUser;
  faDiagramProject = faDiagramProject;
  faCalendar = faCalendar;
  faHouse = faHouse;
}
