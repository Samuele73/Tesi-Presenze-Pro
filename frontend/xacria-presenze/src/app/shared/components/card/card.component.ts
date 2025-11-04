import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  @Output() cardClicked = new EventEmitter<void>();

  emitCardClicked(): void{
    this.cardClicked.emit();
  }
}
