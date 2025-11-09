import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { UsernameService } from '../shared/services/username.service';
import { Username } from '../shared/models/username';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ToastContainerDirective, ToastrService } from 'ngx-toastr';

declare var bootstrap: any;

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit{
  newUsername: Username = null;
  @ViewChild(ToastContainerDirective, { static: true })
  toastContainer!: ToastContainerDirective;

  constructor(
    private usernameService: UsernameService,
    private authService: AuthService,
    private toastrService: ToastrService
  ) {
    this.authService.checkUserAutentication(this.authService.token);
    let userCreds = this.authService.getMyUserProfile();
    if (userCreds != null) {
      userCreds.subscribe({
        next: (resp: any) => {
          console.log('PROFILE: ', resp);
          this.newUsername = { name: resp.name, surname: resp.surname };
        },
        error: (err: any) => {
          console.log('ERRORE PROFILE: ', err);
        },
      });
    }
    this.usernameService.changedUsername.subscribe((newUsername) => {
      console.log('NEW USERNAME', newUsername);
      this.newUsername = newUsername;
    });
  }
  ngOnInit(): void {
    this.toastrService.overlayContainer = this.toastContainer;
  }

}
