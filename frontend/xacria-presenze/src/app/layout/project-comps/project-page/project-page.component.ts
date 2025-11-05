import { Component } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Project, ProjectService } from 'src/generated-client';

@Component({
  selector: 'app-project-page',
  templateUrl: './project-page.component.html',
  styleUrls: ['./project-page.component.scss'],
})
export class ProjectPageComponent {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  isLoading: boolean = false;

  constructor(
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    if (this.authService.isAdmin()) {
      this.projectService.getAllProjects().subscribe({
        next: (projects: Project[]) => {
          this.projects = projects;
          this.filteredProjects = [...this.projects];
          console.log('Loaded projects with Admin privileges:', this.projects);
        },
        error: (err) => {
          console.error('Error loading projects:', err);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else if (!this.authService.isAdmin()) {
      this.projectService.getMyProjects().subscribe({
        next: (projects: Project[]) => {
          this.projects = projects;
          this.filteredProjects = [...this.projects];
          console.log('Loaded projects with User privileges:', this.projects);
        },
        error: (err) => {
          console.error('Error loading projects:', err);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
}
