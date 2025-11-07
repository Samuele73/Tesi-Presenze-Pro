import { Component, Input } from '@angular/core';

export type DropdownOptions = {
  name: string,
  onclick: () => void
}[]

@Component({
  selector: 'app-ngb-options',
  templateUrl: './ngb-options.component.html',
  styleUrls: ['./ngb-options.component.scss']
})
export class NgbOptionsComponent {
  @Input() dropdownOptions!: DropdownOptions;
  @Input() buttonClass?: string;
}
