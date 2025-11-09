import { Component } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Project, ProjectService } from 'src/generated-client';
import { ProjectStoreService } from '../../services/project-store.service';

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
    private authService: AuthService,
    private projectStoreService: ProjectStoreService
  ) {}

  ngOnInit(): void {
    this.subscribeToProjectStoreServices();
    this.projectStoreService.loadProjects();
  }

  subscribeToProjectStoreServices(): void{
    this.projectStoreService.projects$.subscribe((projects: Project[]) => {
      this.projects = projects;
      this.filteredProjects = [...projects];
    })
    this.projectStoreService.isLoading$.subscribe((isLoading: boolean | null) => {
      this.isLoading = isLoading ?? false;
    })
  }

  /* loadProjects(): void {
    this.isLoading = true;
    if (this.authService.isPrivilegedUser()) {
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
    } else if (!this.authService.isPrivilegedUser()) {
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
  } */
}
