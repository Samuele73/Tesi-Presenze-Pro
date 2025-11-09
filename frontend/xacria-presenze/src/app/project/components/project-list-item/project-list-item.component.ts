import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DropdownOptions } from 'src/app/shared/components/ngb-options/ngb-options.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Project } from 'src/generated-client/model/models';
import { ConfirmModalComponent } from '../../../layout/confirm-modal/confirm-modal.component';
import { ProjectService } from 'src/generated-client';
import { ProjectStoreService } from '../../services/project-store.service';
import { APP_ROUTES } from 'src/app/shared/constants/route-paths';

@Component({
  selector: 'app-project-list-item',
  templateUrl: './project-list-item.component.html',
  styleUrls: ['./project-list-item.component.scss'],
})
export class ProjectListItemComponent implements OnInit {
  @Input() project: Project | null = null;
  optionsItems: DropdownOptions = [
    { name: 'Elimina', onclick: () => this.openConfirmDeletionModal() },
  ];
  apiError: string = '';
  APP_ROUTES = APP_ROUTES;

  constructor(
    public authService: AuthService,
    private router: Router,
    public userAuth: AuthService,
    private modalService: NgbModal,
    private projectService: ProjectService,
    private projectStoreService: ProjectStoreService
  ) {}

  ngOnInit(): void {}

  openConfirmDeletionModal() {
    console.log('Controllasdafadsfsfa');
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

  getStatusLabel(status: Project.StatusEnum | undefined): string {
    if (!status) return 'Sconosciuto';
    const statusMap: { [key: string]: string } = {
      CREATED: 'Creato',
      IN_PROGRESS: 'In Corso',
      COMPLETED: 'Completato',
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: Project.StatusEnum | undefined): string {
    if (!status) return 'bg-secondary';
    const classMap: { [key: string]: string } = {
      CREATED: 'bg-secondary',
      IN_PROGRESS: 'bg-warning',
      COMPLETED: 'bg-success',
    };
    console.log(
      'Status class for',
      status,
      ':',
      classMap[status] || 'badge-secondary'
    );
    return classMap[status] || 'bg-secondary';
  }

  deleteProject(): void {
    if (this.project?.id) {
      this.projectStoreService.deleteProject(this.project?.id).subscribe();
    }
    this.apiError = "Non è stato possibile eliminare il progetto"
  }

  goToProject() {
    if (this.project) {
      this.router.navigate([APP_ROUTES.PROJECTS.DETAILS], {
        queryParams: { id: this.project.id },
      });
    }
  }
}
