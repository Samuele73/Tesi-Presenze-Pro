import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  @Output() cardClicked = new EventEmitter<void>();
  @Input() isSmall: boolean = false;

  emitCardClicked(): void{
    this.cardClicked.emit();
  }
}
