import { Component, Input } from '@angular/core';
import { Project } from 'src/generated-client';

@Component({
  selector: 'app-assignment-badges',
  templateUrl: './assignment-badges.component.html',
  styleUrls: ['./assignment-badges.component.scss']
})
export class AssignmentBadgesComponent {
  @Input() project: Project | null = null;
}
