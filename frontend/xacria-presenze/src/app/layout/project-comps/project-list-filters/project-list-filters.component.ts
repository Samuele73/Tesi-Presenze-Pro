import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Project } from 'src/generated-client';

@Component({
  selector: 'app-project-list-filters',
  templateUrl: './project-list-filters.component.html',
  styleUrls: ['./project-list-filters.component.scss'],
})
export class ProjectListFiltersComponent implements OnChanges {
  @Input() projects: Project[] = [];
  @Input() filteredProjects: Project[] = [];
  @Output() filteredProjectsChange = new EventEmitter<Project[]>();

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

  constructor(public authService: AuthService) {}

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
}
