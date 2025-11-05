import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card-list-wrapper',
  templateUrl: './card-list-wrapper.component.html',
  styleUrls: ['./card-list-wrapper.component.scss']
})
export class CardListWrapperComponent {
  @Input() contentLenght!: number;
  @Input() isLoading!: boolean;
  @Input() noEntryMessage: string = "Nessun dato trovato";

  isContentEmpty(): boolean {
    return this.contentLenght === 0;
  }
}
