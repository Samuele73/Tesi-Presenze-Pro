import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Project } from 'src/generated-client';

declare var bootstrap: any;

@Component({
  selector: 'app-assignment-badges',
  templateUrl: './assignment-badges.component.html',
  styleUrls: ['./assignment-badges.component.scss'],
})
export class AssignmentBadgesComponent implements AfterViewInit, OnInit {
  @Input() project: Project | null = null;
   @Input() removable: boolean = false; // true = modalità con rimozione, false = statico
  @Output() userRemoved = new EventEmitter<string>();
  tooltipTitle: string = '';

  ngOnInit(): void {
    this.project?.assignedTo
      ?.slice(1, this.project.assignedTo.length)
      ?.forEach((user) => {
        this.tooltipTitle += user + '\n';
      });
  }
  ngAfterViewInit(): void {
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    const tooltipList = Array.from(tooltipTriggerList).map(
      (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );
  }
  onRemoveUser(user: string): void {
    if (this.removable) {
      this.userRemoved.emit(user);
    }
  }
}
