import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat',
  templateUrl: './stat.component.html',
  styleUrls: ['./stat.component.scss'],
})
export class StatComponent {
  @Input() title: string = '';
  @Input() statName: string = '';
  @Input() value: number = 0;
  @Input() referenceMax: number = 100;

  get percentage(): number {
    return (this.value / this.referenceMax) * 100;
  }

  get circleClass(): string {
    if (this.percentage >= 66) return 'bg-primary';
    if (this.percentage >= 33) return 'bg-warning';
    return 'bg-danger';
  }
}
