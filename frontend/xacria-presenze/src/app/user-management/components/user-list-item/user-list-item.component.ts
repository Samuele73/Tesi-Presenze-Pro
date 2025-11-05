import { Component, Input, OnInit } from '@angular/core';
import { UserBasicDetailsResponse } from 'src/generated-client';

@Component({
  selector: 'app-user-list-item',
  templateUrl: './user-list-item.component.html',
  styleUrls: ['./user-list-item.component.scss'],
})
export class UserListItemComponent implements OnInit {
  @Input() userBasiDetails: UserBasicDetailsResponse | null = null;
  fullName!: string;

  ngOnInit(): void {
    this.fullName = this.userBasiDetails?.name + ' ' + this.userBasiDetails?.surname;
  }
}
