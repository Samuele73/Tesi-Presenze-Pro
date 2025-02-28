import { Component } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  selector: 'app-requests-list',
  templateUrl: './requests-list.component.html',
  styleUrls: ['./requests-list.component.scss']
})
export class RequestsListComponent {
  @Input() listName?: string;
  isPresent: boolean = false;
}
