import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserBasicDetailsResponse } from 'src/generated-client';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent {
  @Input() usersBasicDetails: UserBasicDetailsResponse[] = [];
  @Input() isLoading: boolean = false;
}
