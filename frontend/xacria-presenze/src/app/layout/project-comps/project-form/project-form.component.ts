import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnInit,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Project } from 'src/generated-client';

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss'],
})
export class ProjectFormComponent implements OnChanges, OnInit {
  @Input() project!: Project | null;
  @Output() submit = new EventEmitter<Project>();
  isEmailSame: boolean = false;

  projectForm!: FormGroup;
  newUserEmail: string = '';

  constructor(private fb: FormBuilder) {
    if (this.project == null) this.project = {status: 'CREATED'};
    this.initForm();
  }

  ngOnInit(): void {
    if (this.project == null) this.project = {status: 'CREATED'};
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project'] && this.project) {
      this.initForm();
    }
  }

  public initForm(): void {
    this.projectForm = this.fb.group({
      id: [this?.project?.id],
      name: [this?.project?.name, Validators.required],
      summary: [this?.project?.summary, Validators.required],
      description: [this.project?.description, Validators.required],
      status: [this.project?.status, Validators.required],
      assignedTo: this.fb.array(
        this.project?.assignedTo?.map((email) =>
          this.fb.control(email, Validators.email)
        ) ?? []
      ),
    });
  }

  public ressetAll(): void {
    this.initForm();
    this.newUserEmail = '';
  }

  get assignedTo(): FormArray {
    return this.projectForm.get('assignedTo') as FormArray;
  }

  get formName() {
    return this.projectForm.get('name');
  }
  get formSummary() {
    return this.projectForm.get('summary');
  }
  get formDescription() {
    return this.projectForm.get('description');
  }
  get formStatus() {
    return this.projectForm.get('status');
  }

  addUser(): void {
    const email = this.newUserEmail.trim();
    if (!email) return;

    const control = this.fb.control(email, [Validators.email]);
    if (control.invalid) return;
    if (this.assignedTo.value.includes(email)){
      this.newUserEmail = '';
      return;
    }
    this.isEmailSame = false;
    this.assignedTo.push(control);
    this.newUserEmail = '';
  }

  removeUser(index: number): void {
    this.assignedTo.removeAt(index);
  }

  public onSubmit(): void {
    console.log('controlla', this.projectForm.value);
    this.submit.emit(this.projectForm.value);
  }
}
