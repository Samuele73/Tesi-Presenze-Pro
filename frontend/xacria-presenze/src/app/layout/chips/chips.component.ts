import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chips',
  templateUrl: './chips.component.html',
  styleUrls: ['./chips.component.scss']
})
export class ChipsComponent {
  @Input() text: string = "";
  @Input() mode: "DELETE" | "STATIC" = "STATIC";

  isDeleteMode(): boolean {return this.mode === "DELETE";}

  onDelete(): void {
    // To do
  }
}
