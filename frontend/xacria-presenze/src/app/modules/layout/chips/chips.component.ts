import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-chips',
  templateUrl: './chips.component.html',
  styleUrls: ['./chips.component.scss']
})
export class ChipsComponent {
  @Input() text: string = "";
  @Input() mode: "DELETE" | "STATIC" = "STATIC";
  @Output() delete = new EventEmitter<void>();

  isDeleteMode(): boolean {
    return this.mode === "DELETE";
  }

  onDelete(): void {
    this.delete.emit();
  }
}
