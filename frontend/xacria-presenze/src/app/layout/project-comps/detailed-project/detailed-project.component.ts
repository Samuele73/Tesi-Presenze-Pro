import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  backupTitle = 'Il progetto non è stato trovato';
  statusCode = '';
  isLoading = false;
  isEditMode = false;
  projectForm!: FormGroup;
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
      status: ['CREATED', Validators.required],
      assignedTo: this.fb.array([]) // <-- FormArray
    });
  }

  get assignedTo(): FormArray {
    return this.projectForm.get('assignedTo') as FormArray;
  }

  get formName() { return this.projectForm.get('name'); }
  get formSummary() { return this.projectForm.get('summary'); }
  get formDescription() { return this.projectForm.get('description'); }
  get formStatus() { return this.projectForm.get('status'); }

  private populateForm(): void {
    if (!this.project) return;

    this.projectForm.patchValue({
      id: this.project.id,
      name: this.project.name,
      summary: this.project.summary,
      description: this.project.description,
      status: this.project.status
    });

    this.assignedTo.clear();
    this.project.assignedTo?.forEach(email => {
      this.assignedTo.push(this.fb.control(email, [Validators.email]));
    });
  }

  private getProjectFromQueryParams() {
    this.route.queryParams.subscribe((params) => {
      const projectId = params['id'];
      if (!projectId) return;

      this.isLoading = true;
      this.projectService.getProjectById(projectId).subscribe({
        next: (project) => {
          this.project = project;
          this.populateForm();
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.statusCode = err.status.toString();
          this.project = null;
          this.isLoading = false;
        }
      });
    });
  }

  addUser(): void {
    const email = this.newUserEmail.trim();
    if (!email) return;

    const control = this.fb.control(email, [Validators.email]);

    if (control.invalid) return;
    if (this.assignedTo.value.includes(email)) return;

    this.assignedTo.push(control);
    this.newUserEmail = '';
  }

  removeUser(index: number): void {
    this.assignedTo.removeAt(index);
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.newUserEmail = '';
    this.populateForm();
  }

  onSubmit(): void {
    if (this.projectForm.invalid) return;

    const updatedProject: Project = {
      ...this.projectForm.value,
      assignedTo: this.assignedTo.value
    };

    this.projectService.updateProject(updatedProject, updatedProject.id!).subscribe({
      next: (project) => {
        this.project = project;
        this.isEditMode = false;
        this.newUserEmail = '';
      }
    });
  }

  getChipMode(): 'STATIC' | 'DELETE' {
    return (!this.authService.isAdmin() || !this.isEditMode) ? 'STATIC' : 'DELETE';
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
