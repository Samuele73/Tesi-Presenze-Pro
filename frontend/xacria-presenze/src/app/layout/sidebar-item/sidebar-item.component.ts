import { Component, Input } from '@angular/core';
import { SizeProp } from '@fortawesome/fontawesome-svg-core';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar-item',
  templateUrl: './sidebar-item.component.html',
  styleUrls: ['./sidebar-item.component.scss']
})
export class SidebarItemComponent {
  @Input() icon!: IconDefinition;
  @Input() route!: string;
  @Input() name!: string;
  @Input() iconSize: SizeProp = 'lg';
}
