import { Component } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  selector: 'app-auth-link',
  templateUrl: './auth-link.component.html',
  styleUrls: ['./auth-link.component.scss']
})
export class AuthLinkComponent {
  @Input() text?: string;
  @Input() link?: string;

  constructor(){
    if(!this.link)
      this.link = "."
  }
}
