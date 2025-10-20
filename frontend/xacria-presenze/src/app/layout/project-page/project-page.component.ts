import { Component } from '@angular/core';
import { Project } from 'src/generated-client';

@Component({
  selector: 'app-project-page',
  templateUrl: './project-page.component.html',
  styleUrls: ['./project-page.component.scss']
})
export class ProjectPageComponent {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchTerm: string = '';
  selectedStatus: string = 'ALL';

  projectStatuses = [
    { value: 'ALL', label: 'Tutti' },
    { value: 'CREATED', label: 'Creato' },
    { value: 'IN_PROGRESS', label: 'In Corso' },
    { value: 'COMPLETED', label: 'Completato' }
  ];

  constructor() { }

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    // Simula il caricamento dei progetti
    // Sostituisci con una chiamata al tuo servizio
    this.projects = [
      {
        id: '1',
        name: 'Portale Clienti',
        description: 'Sviluppo del nuovo portale per la gestione clienti con dashboard interattiva',
        status: "IN_PROGRESS",
        assignedTo: ['mario.rossi@example.com', 'giulia.bianchi@example.com']
      },
      {
        id: '2',
        name: 'App Mobile',
        description: 'Applicazione mobile per il tracking delle presenze',
        status: "CREATED",
        assignedTo: ['luca.verdi@example.com']
      },
      {
        id: '3',
        name: 'Sistema di Reporting',
        description: 'Implementazione sistema avanzato di reportistica e analytics',
        status: "COMPLETED",
        assignedTo: ['anna.neri@example.com', 'paolo.gialli@example.com', 'sara.blu@example.com']
      }
    ];

    this.filteredProjects = [...this.projects];
  }

  filterProjects(): void {
    this.filteredProjects = this.projects.filter((project: Project) => {
      const matchesSearch = (project.name?.toLowerCase() || '').includes(this.searchTerm.toLowerCase()) ||
                           (project.description?.toLowerCase() || '').includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.selectedStatus === 'ALL' || project.status === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.filterProjects();
  }

  onStatusChange(): void {
    this.filterProjects();
  }

  getStatusLabel(status: Project.StatusEnum | undefined): string {
    if(!status)
      return 'Sconosciuto';
    const statusMap: { [key: string]: string } = {
      'CREATED': 'Creato',
      'IN_PROGRESS': 'In Corso',
      'COMPLETED': 'Completato'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: Project.StatusEnum | undefined): string {
    if(!status)
      return 'bg-secondary';
    const classMap: { [key: string]: string } = {
      'CREATED': 'bg-secondary',
      'IN_PROGRESS': 'bg-warning',
      'COMPLETED': 'bg-success'
    };
    console.log('Status class for', status, ':', classMap[status] || 'badge-secondary');
    return classMap[status] || 'bg-secondary';
  }

  viewProject(project: Project): void {
    console.log('Visualizza progetto:', project);
    // Implementa la navigazione al dettaglio del progetto
  }
}
