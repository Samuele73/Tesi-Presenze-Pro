import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { ApiError } from 'src/app/shared/models/api-error.models';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ToastI18nService } from 'src/app/shared/services/toast-i18n.service';
import {
  CreateProjectRequest,
  Project,
  ProjectIdResponse,
  ProjectService,
} from 'src/generated-client';

@Injectable({
  providedIn: 'root',
})
export class ProjectStoreService {
  private projectsSubject: BehaviorSubject<Project[]> = new BehaviorSubject<
    Project[]
  >([]);
  private apiErrorSubject: BehaviorSubject<ApiError | null> =
    new BehaviorSubject<ApiError | null>(null);
  private isLoadingSubject: BehaviorSubject<boolean | null> =
    new BehaviorSubject<boolean | null>(null);
  private userProjectsName: BehaviorSubject<string[]> = new BehaviorSubject<
    string[]
  >([]);

  constructor(
    private authService: AuthService,
    private projectService: ProjectService,
    private toast: ToastI18nService
  ) {}

  get projects$() {
    return this.projectsSubject.asObservable();
  }
  get apiError$() {
    return this.apiErrorSubject.asObservable();
  }
  get isLoading$() {
    return this.isLoadingSubject.asObservable();
  }
  get userProjectsName$() {
    return this.userProjectsName.asObservable();
  }

  loadProjects(): void {
    this.isLoadingSubject.next(true);
    const request$ = this.authService.isPrivilegedUser()
      ? this.projectService.getAllProjects()
      : this.projectService.getMyProjects();
    request$.subscribe({
      next: (projects: Project[]) => {
        this.projectsSubject.next(projects);
        this.apiErrorSubject.next(null);
      },
      error: (err: HttpErrorResponse) => {
        console.warn('Erro on project get from the server', err);
        this.apiErrorSubject.next({
          error: err.error.message,
          op: 'GET',
        });
        this.toast.error(err.error.message);
      },
      complete: () => this.isLoadingSubject.next(false),
    });
  }

  getUserProjectsNames(): Observable<boolean> {
    return this.projectService.getMyProjects().pipe(
      tap((projects: Project[]) => {
        const projectNames = projects.map((project) => project.name!);
        this.userProjectsName.next(projectNames);
      }),
      map(() => true),
      catchError((err) => {
        console.error('Error fetching user projects:', err);
        this.toast.error("Errore nel recupero dei nomi dei progetti")
        return of(false);
      })
    )
  }

  addProject(project: CreateProjectRequest): Observable<boolean> {
    return this.projectService.saveProject(project).pipe(
      tap((createdProject: Project) => {
        this.projectsSubject.next([
          ...this.projectsSubject.value,
          createdProject,
        ]);
        this.apiErrorSubject.next(null);
      }),
      map(() => true),
      catchError((err: HttpErrorResponse) => {
        console.warn('Error with add project request', err);
        this.apiErrorSubject.next({
          error: err.error.message,
          op: 'ADD',
        });
        this.toast.error(err.error.message);
        return of(false);
      })
    );
  }

  deleteProject(id: string): Observable<boolean> {
  return this.projectService.deleteProject(id).pipe(
    tap((projectId: ProjectIdResponse) => {
      const projects = this.projectsSubject.value.filter(
        (p) => p.id != projectId.id
      );
      this.projectsSubject.next(projects);
      this.apiErrorSubject.next(null);
    }),
    map(() => true),
    catchError((err: HttpErrorResponse) => {
      console.warn('Could not delete project', err);
      this.apiErrorSubject.next({
        error: err.error.message,
        op: 'DELETE',
      });
      this.toast.error(err.error.message);
      return of(false);
    })
  );
}

  updateProject(project: Project): Observable<boolean> {
    if (!project.id) {
      console.error('Project ID is missing, cannot update');
      return of(false);
    }

    return this.projectService.updateProject(project, project.id).pipe(
      tap((updatedProject: Project) => {
        const updatedList = this.projectsSubject.value.map((p) =>
          p.id === updatedProject.id ? updatedProject : p
        );
        this.projectsSubject.next(updatedList);
        this.apiErrorSubject.next(null);
      }),
      map(() => true),
      catchError((err: HttpErrorResponse) => {
        console.warn('Could not update the project', err);
        this.apiErrorSubject.next({
          error: err.error.message,
          op: 'UPDATE',
        });
        this.toast.error(err.error.message);
        return of(false);
      })
    );
  }
}
