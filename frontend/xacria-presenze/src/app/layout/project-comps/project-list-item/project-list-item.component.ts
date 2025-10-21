import { Component, Input } from '@angular/core';
import { Project } from 'src/generated-client/model/models';

@Component({
  selector: 'app-project-list-item',
  templateUrl: './project-list-item.component.html',
  styleUrls: ['./project-list-item.component.scss'],
})
export class ProjectListItemComponent {
  @Input() project: Project | null = null;

  constructor() {}

  getStatusLabel(status: Project.StatusEnum | undefined): string {
    if (!status) return 'Sconosciuto';
    const statusMap: { [key: string]: string } = {
      CREATED: 'Creato',
      IN_PROGRESS: 'In Corso',
      COMPLETED: 'Completato',
    };
    return statusMap[status] || status;
  }

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
}
