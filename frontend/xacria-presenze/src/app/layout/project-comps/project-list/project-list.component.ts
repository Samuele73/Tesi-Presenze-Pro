import { Component, Input } from '@angular/core';
import { Project } from 'src/generated-client';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent {

  @Input() projects: Project[] = [];
  @Input() isLoading: boolean = false;

  constructor() {
    console.log("ProjectListComponent initialized with projects:", this.projects);
  }


  getStatusLabel(status: Project.StatusEnum | undefined): string {
      if(!status)
        return 'Sconosciuto';
      const statusMap: { [key: string]: string } = {
        'CREATED': 'Creato',
        'IN_PROGRESS': 'In Corso',
        'COMPLETED': 'Completato'
      };
      return statusMap[status] || status;
    }

    getStatusClass(status: Project.StatusEnum | undefined): string {
      if(!status)
        return 'bg-secondary';
      const classMap: { [key: string]: string } = {
        'CREATED': 'bg-secondary',
        'IN_PROGRESS': 'bg-warning',
        'COMPLETED': 'bg-success'
      };
      console.log('Status class for', status, ':', classMap[status] || 'badge-secondary');
      return classMap[status] || 'bg-secondary';
    }

    viewProject(project: Project): void {
      console.log('Visualizza progetto:', project);
      // Implementa la navigazione al dettaglio del progetto
    }
}
