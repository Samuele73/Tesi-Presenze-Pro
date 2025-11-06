import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ButtonMode = 'SAVE' | 'DELETE' | 'UNDO'

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() name!: string;
  @Input() mode!: ButtonMode;
  @Output() buttonClick = new EventEmitter<void>();
  @Input() type: string = 'button';
  @Input() buttonDisabled: boolean = false;


  getButtonClass(): string{
    const defaultCLass: string = "btn ";
    switch(this.mode){
      case 'DELETE':
        return defaultCLass + 'btn-danger';
      case 'SAVE':
        return defaultCLass + 'btn-primary text-white';
      case 'UNDO':
        return defaultCLass + 'btn-outline-secondary';
      default:
        return defaultCLass + 'btn-alert border-0';
    }
  }

  emitClickEvent(): void{
    this.buttonClick.emit();
  }
}
