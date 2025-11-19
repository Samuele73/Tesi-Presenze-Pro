import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { APP_ROUTES } from 'src/app/shared/constants/route-paths';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  isNotified: boolean = false;

  constructor(private notifService: NotificationService, private toastrService: ToastrService, private router: Router) {
    this.isNotified = sessionStorage.getItem('isNotified') === 'true';
  }

  ngOnInit(): void {
    this.notifService.$notif.subscribe((message: string | null) => {
      this.isNotified = message !== null;
      sessionStorage.setItem('isNotified', this.isNotified ? 'true' : 'false');
      if(message !== null)
        this.toastrService.info(message);
    });
  }

  onClick() {
    this.notifService.readNotif();
    this.router.navigate([APP_ROUTES.HOME]);
  }
}
