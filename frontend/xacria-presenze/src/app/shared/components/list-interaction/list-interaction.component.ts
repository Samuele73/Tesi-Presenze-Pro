import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-list-interaction',
  templateUrl: './list-interaction.component.html',
  styleUrls: ['./list-interaction.component.scss'],
})
export class ListInteractionComponent {
  areFiltersCollapsed: boolean = true;
  addProjectRequestError: string | undefined;
  @Output() addButtonClick = new EventEmitter<void>();
  @Input() hasAddButtonPermission!: boolean;
  @Input() addButtonName: string = "Add button name!"

  constructor() {}

  onAddButtonClick(): void{
    this.addButtonClick.emit();
  }
}
