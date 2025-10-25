import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Project } from 'src/generated-client';
import { ProjectService } from 'src/generated-client/api/api';

@Component({
  selector: 'app-detailed-project',
  templateUrl: './detailed-project.component.html',
  styleUrls: ['./detailed-project.component.scss'],
})
export class DetailedProjectComponent implements OnInit {
  project: Project | null = null;
  backupTitle: string = 'Il progetto non è stato trovato';
  statusCode: string = '';

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.getProjectFromQueryParams();
  }

  private getProjectFromQueryParams() {
    this.route.queryParams.subscribe((params) => {
      const projectId = params['id'];
      if (projectId) {
        this.projectService.getProjectById(projectId).subscribe({
          next: (project) => {
            console.log('Project details:', project);
            this.project = project;
            console.log('Loaded project:', this.project);
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error loading project:', err);
            if (err.status === 404) {
              this.backupTitle = 'Progetto non trovato';
            }
            this.statusCode = err.status.toString();
            this.project = null;
          },
        });
      } else {
        this.project = null;
        console.warn('No project ID found in query parameters.');
      }
    });
  }

  getBadgesNgClass(): Record<string, boolean> {
    const status = this.project?.status;
    return {
      'bg-success': status === 'COMPLETED',
      'bg-warning': status === 'IN_PROGRESS',
      'bg-secondary': status === 'CREATED',
      'bg-danger':
        status !== 'COMPLETED' && status !== 'IN_PROGRESS' && status !== 'CREATED',
    };
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
