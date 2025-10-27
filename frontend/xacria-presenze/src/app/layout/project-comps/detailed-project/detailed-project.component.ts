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
  isLoading: boolean = false;
  isEditMode: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.getProjectFromQueryParams();
  }

  private getProjectFromQueryParams() {
    this.route.queryParams.subscribe((params) => {
      const projectId = params['id'];
      if (projectId) {
        this.isLoading = true;
        this.projectService.getProjectById(projectId).subscribe({
          next: (project) => {
            this.project = project;
            this.isLoading = false;
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error loading project:', err);
            if (err.status === 404) {
              this.backupTitle = 'Progetto non trovato';
            }
            this.statusCode = err.status.toString();
            this.project = null;
            this.isLoading = false;
          }
        });
      } else {
        this.project = null;
      }
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
  }

  getChipMode(): 'STATIC' | 'DELETE' {
    if (!this.authService.isAdmin()) return 'STATIC';
    return this.isEditMode ? 'DELETE' : 'STATIC';
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

  get hasProject(): boolean {
    return !!this.project;
  }

  get showContent(): boolean {
    // Mostra il contenuto se stiamo caricando o se il progetto esiste
    return this.isLoading || this.hasProject;
  }

  get showDetails(): boolean {
    // Mostra i dettagli se non siamo in modalità di modifica
    return !this.isEditMode;
  }
}
