import { Component } from '@angular/core';
import { faUser, faUsers, faDiagramProject, faCalendar, faHouse } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  faUsers = faUsers;
  faUser = faUser;
  faDiagramProject = faDiagramProject;
  faCalendar = faCalendar;
  faHouse = faHouse;
}
