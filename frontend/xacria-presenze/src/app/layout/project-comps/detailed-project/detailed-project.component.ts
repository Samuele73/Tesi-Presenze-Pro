import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { preventDefault } from '@fullcalendar/core/internal';
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
  projectForm!: FormGroup;
  assignedUsers: string[] = [];
  newUserEmail: string = '';

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    public authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.initForm();
    this.getProjectFromQueryParams();
  }

  private initForm(): void {
    this.projectForm = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      summary: ['', Validators.required],
      description: ['', Validators.required],
      status: ['CREATED', Validators.required]
    });
  }

  get formName() { return this.projectForm.get('name'); }
  get formSummary() { return this.projectForm.get('summary'); }
  get formDescription() { return this.projectForm.get('description'); }
  get formStatus() { return this.projectForm.get('status'); }

  private populateForm(): void {
    if (this.project) {
      this.projectForm.patchValue({
        id: this.project.id,
        name: this.project.name,
        summary: this.project.summary,
        description: this.project.description,
        status: this.project.status
      });

      // Popola l'array degli utenti assegnati
      this.assignedUsers = this.project.assignedTo ? [...this.project.assignedTo] : [];
    }
  }

  private getProjectFromQueryParams() {
    this.route.queryParams.subscribe((params) => {
      const projectId = params['id'];
      if (projectId) {
        this.isLoading = true;
        this.projectService.getProjectById(projectId).subscribe({
          next: (project) => {
            this.project = project;
            this.populateForm();
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

  addUser(): void {
    const email = this.newUserEmail.trim();

    // Validazione base dell'email
    if (email && this.isValidEmail(email)) {
      // Verifica che l'email non sia già presente
      if (!this.assignedUsers.includes(email)) {
        this.assignedUsers.push(email);
        this.newUserEmail = ''; // Reset dell'input
      } else {
        console.warn('Utente già assegnato');
        // Opzionale: mostra un messaggio di avviso
      }
    } else {
      console.warn('Email non valida');
      // Opzionale: mostra un messaggio di errore
    }
  }

  removeUser(index: number): void {
    this.assignedUsers.splice(index, 1);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.populateForm();
    }
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.newUserEmail = '';
    this.populateForm(); // Reset del form ai valori originali
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      const updatedProject: Project = {
        ...this.projectForm.value,
        assignedTo: this.assignedUsers
      };

      // Chiamata al servizio per aggiornare il progetto
      this.projectService.updateProject(updatedProject, updatedProject.id!).subscribe({
        next: (project) => {
          this.project = project;
          this.isEditMode = false;
          this.newUserEmail = '';
          console.log('Progetto aggiornato con successo');
          // Opzionale: mostra un messaggio di successo
        },
        error: (err: HttpErrorResponse) => {
          console.error('Errore durante l\'aggiornamento del progetto:', err);
          // Opzionale: mostra un messaggio di errore
        }
      });
    }
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
    return this.isLoading || this.hasProject;
  }

  get showDetails(): boolean {
    return !this.isEditMode;
  }
}
