import { Component, Input } from '@angular/core';

type badgeStatus = 'ACCEPTED' | 'PENDING' | 'REJECTED';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input() notifs: number | null = null;
  @Input() status: badgeStatus = 'PENDING';

  constructor() { }

  get badgeColorClass(): string {
    return this.status === 'ACCEPTED' ? 'bg-primary' :
           this.status === 'PENDING' ? 'bg-warning' :
           this.status === 'REJECTED' ? 'bg-danger' : 'bg-warning';
  }
}
