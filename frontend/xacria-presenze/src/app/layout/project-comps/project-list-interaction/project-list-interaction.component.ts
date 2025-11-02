import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Project, ProjectService } from 'src/generated-client';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { FormArray, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-project-list-interaction',
  templateUrl: './project-list-interaction.component.html',
  styleUrls: ['./project-list-interaction.component.scss'],
})
export class ProjectListInteractionComponent implements OnChanges {
  @Input() projects: Project[] = [];
  @Input() filteredProjects: Project[] = [];
  @Output() filteredProjectsChange = new EventEmitter<Project[]>();
  @Output() newProject = new EventEmitter<Project>();
  areFiltersCollapsed: boolean = true;
  @ViewChild('projectFormComp') projectFormComponent!: ProjectFormComponent;
  addProjectRequestError: string | undefined;

  searchTerm: string = '';
  selectedStatus: string = 'ALL';
  selectedAssignedTo: string = 'ALL';

  projectStatuses = [
    { value: 'ALL', label: 'Tutti' },
    { value: 'CREATED', label: 'Creato' },
    { value: 'IN_PROGRESS', label: 'In Corso' },
    { value: 'COMPLETED', label: 'Completato' },
  ];

  assignedToList: string[] = [];

  constructor(
    public authService: AuthService,
    private modalService: NgbModal,
    private projectService: ProjectService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projects'] && this.projects) {
      this.generateAssignedToList();
      this.filterProjects();
    }
  }

  /** 🔹 Crea la lista di utenti assegnatari senza duplicati */
  private generateAssignedToList(): void {
    const allAssigned: string[] = this.projects
      .flatMap((p) => p.assignedTo || [])
      .filter(Boolean);

    // Usa Set per rimuovere duplicati e ordina alfabeticamente
    this.assignedToList = Array.from(new Set(allAssigned)).sort();
  }

  /** 🔹 Applica tutti i filtri contemporaneamente */
  filterProjects(): void {
    const filtered = this.projects.filter((project: Project) => {
      const matchesSearch = (project.name?.toLowerCase() || '').includes(
        this.searchTerm.toLowerCase()
      );

      const matchesStatus =
        this.selectedStatus === 'ALL' || project.status === this.selectedStatus;

      const matchesAssigned =
        this.selectedAssignedTo === 'ALL' ||
        (project.assignedTo || []).includes(this.selectedAssignedTo);

      return matchesSearch && matchesStatus && matchesAssigned;
    });

    this.filteredProjects = filtered;
    this.filteredProjectsChange.emit(filtered);
  }

  onSearchChange(): void {
    this.filterProjects();
  }

  onStatusChange(): void {
    this.filterProjects();
  }

  onAssignedToChange(): void {
    this.filterProjects();
  }

  openAddProjectModal(content: any): void {
    this.modalService
      .open(content, { ariaLabelledBy: 'modal-basic-title' })
      .result.then(
        (result) => {
          console.log(`Closed with: ${result}`);
        },
        (reason) => {
          console.log(`Dismissed ${reason}`);
        }
      );
  }

  submitAddProjectForm(component: ProjectFormComponent): void {
    console.log('Look here', component.projectForm.value);
    this.projectService.saveProject(component.projectForm.value).subscribe({
      next: (project: Project) => {
        console.log('new project', project);
        this.newProject.emit(project);
        this.modalService.dismissAll();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error with add project reqeust', error);
        if (error.status == 400) {
          this.addProjectRequestError =
            'Una o più email indicate non risultano registrate!';
        }
      },
    });
  }
}
