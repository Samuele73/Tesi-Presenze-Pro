import { Component, Input } from '@angular/core';
import { Project } from 'src/generated-client';

@Component({
  selector: 'app-project-status',
  templateUrl: './project-status.component.html',
  styleUrls: ['./project-status.component.scss'],
})
export class ProjectStatusComponent {
  @Input() project: Project | null = null;
  @Input() class: string = "";

  getStatusClass(status: Project.StatusEnum | undefined): string {
    if (!status) return 'bg-secondary';
    const classMap: { [key: string]: string } = {
      CREATED: 'bg-secondary',
      IN_PROGRESS: 'bg-warning',
      COMPLETED: 'bg-success',
    };
    console.log(
      'Status class for',
      status,
      ':',
      classMap[status] || 'badge-secondary'
    );
    return classMap[status] || 'bg-secondary';
  }

  getStatusLabel(status: Project.StatusEnum | undefined): string {
    if (!status) return 'Sconosciuto';
    const statusMap: { [key: string]: string } = {
      CREATED: 'Creato',
      IN_PROGRESS: 'In Corso',
      COMPLETED: 'Completato',
    };
    return statusMap[status] || status;
  }
}
