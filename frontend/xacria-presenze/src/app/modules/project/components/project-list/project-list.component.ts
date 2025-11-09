import { Component, Input } from '@angular/core';
import { Project } from 'src/generated-client';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent {

  @Input() projects: Project[] = [];
  @Input() isLoading: boolean = false;

  constructor() {
    console.log("ProjectListComponent initialized with projects:", this.projects);
  }
}
