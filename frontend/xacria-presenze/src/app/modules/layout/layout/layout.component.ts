import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { UsernameService } from '../shared/services/username.service';
import { Username } from '../../custom-calendar/models/username';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ToastContainerDirective } from 'ngx-toastr';
import { UserEmailResponse, UserService } from 'src/generated-client';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { ToastI18nService } from 'src/app/shared/services/toast-i18n.service';

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
    private toast: ToastI18nService,
    private userService: UserService,
    private notifService: NotificationService
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
    this.toast.setOverlayContainer(this.toastContainer);
    if(this.authService.token)
      this.userService.getEmailFromTkn(this.authService.token!!).subscribe({
        next: (email: UserEmailResponse) => {
          const fetchedEmail: string | undefined = email.email;
          if (fetchedEmail) {
            this.authService.email = fetchedEmail;
            this.notifService.connect(fetchedEmail);
          }
        },
      });
  }

  onClick(){
    this.toast.success('prova')
  }

}
