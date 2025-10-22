import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Project } from 'src/generated-client';

@Component({
  selector: 'app-project-list-filters',
  templateUrl: './project-list-filters.component.html',
  styleUrls: ['./project-list-filters.component.scss'],
})
export class ProjectListFiltersComponent implements OnChanges {
  // Tutti i progetti originali
  @Input() projects: Project[] = [];

  // Progetti filtrati, legati al padre in two-way binding
  @Input() filteredProjects: Project[] = [];
  @Output() filteredProjectsChange = new EventEmitter<Project[]>();

  searchTerm: string = '';
  selectedStatus: string = 'ALL';

  projectStatuses = [
    { value: 'ALL', label: 'Tutti' },
    { value: 'CREATED', label: 'Creato' },
    { value: 'IN_PROGRESS', label: 'In Corso' },
    { value: 'COMPLETED', label: 'Completato' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    // Se il padre aggiorna la lista completa, riapplica i filtri
    if (changes['projects'] && this.projects) {
      this.filterProjects();
    }
  }

  filterProjects(): void {
    const filtered = this.projects.filter((project: Project) => {
      const matchesSearch = (project.name?.toLowerCase() || '').includes(
        this.searchTerm.toLowerCase()
      );
      const matchesStatus =
        this.selectedStatus === 'ALL' || project.status === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });

    // Aggiorna lo stato interno e notifica il padre
    this.filteredProjects = filtered;
    this.filteredProjectsChange.emit(filtered);
  }

  onSearchChange(): void {
    this.filterProjects();
  }

  onStatusChange(): void {
    this.filterProjects();
  }
}
