import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { APP_ROUTES } from 'src/app/shared/constants/route-paths';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { ToastI18nService } from 'src/app/shared/services/toast-i18n.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  isNotified: boolean = false;

  constructor(private notifService: NotificationService, private toast: ToastI18nService, private router: Router) {
  }

  ngOnInit(): void {
    this.notifService.$notif.subscribe((message: string | null) => {
      this.isNotified = message !== null;
      sessionStorage.setItem('isNotified', this.isNotified ? 'true' : 'false');
      if(message !== null)
        this.toast.info(message);
    });
  }

  onClick() {
    if(!this.isNotified)
      return;
    this.notifService.readNotif();
    this.router.navigate([APP_ROUTES.HOME]);
  }
}
