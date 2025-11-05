import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card-badge',
  templateUrl: './card-badge.component.html',
  styleUrls: ['./card-badge.component.scss'],
})
export class CardBadgeComponent {
  @Input() class: string = '';
  @Input() labelMap!: { [key: string]: string };
  @Input() classMap!: { [key: string]: string };
  @Input() mapValue!: string | undefined;

  getBadgeClass(): string {
    if (!this.mapValue) return 'bg-secondary';
    return this.classMap[this.mapValue] || 'bg-secondary';
  }

  getBadgeLabel(): string {
    if (!this.mapValue) return 'Sconosciuto';
    return this.labelMap[this.mapValue];
  }
}
