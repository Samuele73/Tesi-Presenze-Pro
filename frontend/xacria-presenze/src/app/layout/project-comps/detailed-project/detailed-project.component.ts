import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Project } from 'src/generated-client';
import { ProjectService } from 'src/generated-client/api/api';
import { ConfirmModalComponent } from '../../confirm-modal/confirm-modal.component';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { DropdownOptions } from 'src/app/shared/components/ngb-options/ngb-options.component';

@Component({
  selector: 'app-detailed-project',
  templateUrl: './detailed-project.component.html',
  styleUrls: ['./detailed-project.component.scss'],
})
export class DetailedProjectComponent implements OnInit {
  project: Project | null = null;
  backupTitle = 'Il progetto non è stato trovato';
  statusCode = '';
  isLoading = false;
  isEditMode = false;
  modalCloseResult: string = '';
  private projcetId: string | null = null;
  @ViewChild('projectFormComp') projectFormComponent!: ProjectFormComponent;

  dropdownItems: DropdownOptions = [
  { name: 'Annulla', onclick: () => this.cancelEdit() },
  { name: 'Elimina', onclick: () => this.openConfirmDeletionModal() }
];

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    public authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.getProjectFromQueryParams();
    this.isEditMode = this.authService.isAdmin();
  }

  private getProjectFromQueryParams() {
    this.route.queryParams.subscribe((params) => {
      const projectId = params['id'];
      if (!projectId) return;

      this.isLoading = true;
      this.projectService.getProjectById(projectId).subscribe({
        next: (project) => {
          this.project = project;
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.statusCode = err.status.toString();
          this.project = null;
          this.isLoading = false;
        },
      });
    });
  }

  cancelEdit(): void {
    this.projectFormComponent.ressetAll();
  }

  onSubmit(): void {
    const compProjectForm: FormGroup = this.projectFormComponent.projectForm;
    const compProjcetFormAssignedTo: FormArray =
      this.projectFormComponent.assignedTo;
    if (compProjectForm.invalid) return;

    const updatedProject: Project = {
      ...compProjectForm.value,
      assignedTo: compProjcetFormAssignedTo.value,
    };

    this.projectService
      .updateProject(updatedProject, updatedProject.id!)
      .subscribe({
        next: (project) => {
          this.project = project;
          this.router.navigate(['/app/projects']);
        },
      });
  }

  getChipMode(): 'STATIC' | 'DELETE' {
    return !this.authService.isAdmin() || !this.isEditMode
      ? 'STATIC'
      : 'DELETE';
  }

  deleteProject(): void {
    if (!this.project || !this.project.id) return;
    this.projectService.deleteProject(this.project.id).subscribe({
      next: () => {
        this.router.navigate(['/app/projects']);
      },
      error: (error: HttpErrorResponse) => {
        console.log(error, 'dasfasfdsaf');
        this.router.navigate(['/app/projects']);
      },
    });
  }

  openModal(content: any) {
    this.modalService
      .open(content, { ariaLabelledBy: 'modal-basic-title' })
      .result.then(
        (result) => {
          this.modalCloseResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.modalCloseResult = `Dismissed ${reason}`;
        }
      );
  }

  /* Handle delete confirmation modal */
  openConfirmDeletionModal() {
    const modalRef = this.modalService.open(ConfirmModalComponent, {
      centered: true,
    });
    modalRef.componentInstance.title = 'Conferma eliminazione!';
    modalRef.componentInstance.message =
      'Sei sicuro di voler eliminare questo progetto? Questa azione non può essere annullata.';
    modalRef.componentInstance.mode = 'DELETE';
    modalRef.componentInstance.confirm.subscribe(() => {
      this.deleteProject();
    });
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
