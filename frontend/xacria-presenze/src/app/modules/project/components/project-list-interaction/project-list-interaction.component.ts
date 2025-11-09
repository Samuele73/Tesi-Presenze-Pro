import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  OnInit,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Project, ProjectService } from 'src/generated-client';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ProjectStoreService,
} from '../../services/project-store.service';
import { ApiError } from 'src/app/shared/models/api-error.models';

@Component({
  selector: 'app-project-list-interaction',
  templateUrl: './project-list-interaction.component.html',
  styleUrls: ['./project-list-interaction.component.scss'],
})
export class ProjectListInteractionComponent implements OnChanges, OnInit {
  @Input() projects: Project[] = [];
  @Input() filteredProjects: Project[] = [];
  @Output() filteredProjectsChange = new EventEmitter<Project[]>();
  @ViewChild('projectFormComp') projectFormComponent!: ProjectFormComponent;
  addProjectRequestError: string | undefined;
  addButtonName: string = 'Aggiungi Progetto';

  searchTerm: string = '';

  /** Ora entrambi sono array perché MultiSelect */
  selectedStatus: string[] = [];
  selectedAssignedTo: string[] = [];

  projectStatuses = [
    { value: 'CREATED', label: 'Creato' },
    { value: 'IN_PROGRESS', label: 'In Corso' },
    { value: 'COMPLETED', label: 'Completato' },
  ];

  assignedToList: string[] = [];

  constructor(
    public authService: AuthService,
    private modalService: NgbModal,
    private projectService: ProjectService,
    private projectStoreService: ProjectStoreService
  ) {}

  subscribeToProjectStoreServices(): void {
    this.projectStoreService.apiError$.subscribe(
      (apiError: ApiError | null) => {
        this.addProjectRequestError = apiError?.error ?? '';
      }
    );
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projects'] && this.projects) {
      this.generateAssignedToList();
      this.filterProjects();
    }
  }

  private generateAssignedToList(): void {
    const allAssigned: string[] = this.projects
      .flatMap((p) => p.assignedTo || [])
      .filter(Boolean);

    this.assignedToList = Array.from(new Set(allAssigned)).sort();
  }

  /** Applica tutti i filtri */
  filterProjects(): void {
    const filtered = this.projects.filter((project: Project) => {
      const matchesSearch = (project.name?.toLowerCase() || '').includes(
        this.searchTerm.toLowerCase()
      );

      const matchesStatus =
        this.selectedStatus.length === 0 ||
        this.selectedStatus.includes(project.status || '');

      const matchesAssigned =
        this.selectedAssignedTo.length === 0 ||
        project.assignedTo?.some((u) => this.selectedAssignedTo.includes(u));

      return matchesSearch && matchesStatus && matchesAssigned;
    });

    this.filteredProjects = filtered;
    this.filteredProjectsChange.emit(filtered);
  }

  openAddProjectModal(content: any): void {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' });
  }

  /* submitAddProjectForm(component: ProjectFormComponent): void {
    this.projectService.saveProject(component.projectForm.value).subscribe({
      next: (project: Project) => {
        this.newProject.emit(project);
        this.modalService.dismissAll();
      },
      error: (error: HttpErrorResponse) => {
        this.addProjectRequestError = error.error.message;
      },
    });
  } */

  submitAddProjectForm(component: ProjectFormComponent): void {
    this.projectStoreService
      .addProject(component.projectForm.value)
      .subscribe((result: boolean) => {
        if (result) this.modalService.dismissAll();
      });
  }
}
