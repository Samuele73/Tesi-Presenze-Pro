import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export type confirmModalMode = 'DEFAULT' | 'DELETE';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent {
  @Output() confirm = new EventEmitter<void>();
  @Input() title: string = 'Inserire titolo';
  @Input() message: string = 'Inserire messaggio';
  @Input() mode: confirmModalMode = 'DEFAULT';

  constructor(public activeModal: NgbActiveModal) {}

  onDelete() {
    this.confirm.emit();
    this.activeModal.close();
  }

  confirmButtonColorClass() {
    return {
      'btn-danger': this.mode == 'DELETE',
      'btn-primary': this.mode == 'DEFAULT',
    };
  }
}
