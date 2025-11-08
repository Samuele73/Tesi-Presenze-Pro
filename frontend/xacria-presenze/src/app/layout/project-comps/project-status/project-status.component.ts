import { Component, Input } from '@angular/core';
import { Project } from 'src/generated-client';

@Component({
  selector: 'app-project-status',
  templateUrl: './project-status.component.html',
  styleUrls: ['./project-status.component.scss'],
})
export class ProjectStatusComponent {
  @Input() project: Project | null = null;
  @Input() class: string = '';

  classMap: { [key: string]: string } = {
    CREATED: 'bg-secondary-subtle text-muted',
    IN_PROGRESS: 'bg-warning',
    COMPLETED: 'bg-success',
  };

  statusMap: { [key: string]: string } = {
      CREATED: 'Creato',
      IN_PROGRESS: 'In Corso',
      COMPLETED: 'Completato',
    };
}
