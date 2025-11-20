import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { APP_ROUTES } from 'src/app/shared/constants/route-paths';
import { AuthService } from 'src/app/shared/services/auth.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import {
  ApprovalRequestTab,
  CalendarService,
  Pageable,
  PagedResponseUserRequestResponseDto,
  UserService,
  UserVacationHours,
} from 'src/generated-client';

type userVacationValues = {
  annualLeaveDays?: number;
  annualPermitHours?: number;
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  userVacationHours?: userVacationValues;
  requestsByTab: Record<
    ApprovalRequestTab,
    PagedResponseUserRequestResponseDto
  > = {
    OPEN: {},
    CLOSED: {},
  };

  constructor(
    public authService: AuthService,
    private userService: UserService,
    private toastrService: ToastrService,
    private calendarService: CalendarService,
    private notifService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getRemainingHolidayHours();
    this.getRequestsFromAPi();
    this.subscriteToNotifications();
  }

  private subscriteToNotifications(): void {
    this.notifService.$notif.subscribe((message: string | null) => {
      if (message !== null && this.router.url.startsWith(APP_ROUTES.HOME)) {
        this.getRemainingHolidayHours();
        this.getRequestsFromAPi();
        this.notifService.readNotif();
      }
    });
  }

  private getRemainingHolidayHours(): void {
    this.userService.getMyRemainingHolidayHours().subscribe({
      next: (value: UserVacationHours) => {
        console.log('check', value);

        let annualLeaveDays = value.annualLeaveHours;
        if (value.annualLeaveHours)
          annualLeaveDays = value.annualLeaveHours / 24;
        this.userVacationHours = {
          annualLeaveDays: annualLeaveDays,
          annualPermitHours: value.annualPermitHours,
        };
      },
      error: (err: HttpErrorResponse) => {
        this.toastrService.error(
          'Problema con il reperiemento dei valori delle pie: ' +
            err.error.message
        );
      },
    });
  }

  private getRequestsFromAPi(): void {
    const pageable: Pageable & { toString(): string } = {
      page: 0,
      size: this.authService.isOwner() ? 20 : 10,
      sort: ['createdAt,desc'],
      toString() {
        return JSON.stringify({
          page: this.page,
          size: this.size,
          sort: this.sort ?? [],
        });
      },
    };
    let $openTabRequest = this.calendarService.getAllRequests(pageable, 'OPEN');
    let $closedTabRequest = this.calendarService.getAllRequests(
      pageable,
      'CLOSED'
    );
    if (!this.authService.isPrivilegedUser()) {
      $openTabRequest = this.calendarService.getUserRequests(pageable, 'OPEN');
      $closedTabRequest = this.calendarService.getUserRequests(
        pageable,
        'CLOSED'
      );
    }
    $openTabRequest.subscribe({
      next: (requests: PagedResponseUserRequestResponseDto) => {
        this.requestsByTab['OPEN'] = requests;
      },
      error: (err: HttpErrorResponse) => {
        this.toastrService.error(err.error.message);
      },
    });
    $closedTabRequest.subscribe({
      next: (requests: PagedResponseUserRequestResponseDto) => {
        this.requestsByTab['CLOSED'] = requests;
      },
      error: (err: HttpErrorResponse) => {
        this.toastrService.error(err.error.message);
      },
    });
  }
  
  containerLayoutBasedOnRole(): string{
    return this.authService.isOwner() ? 'row-cols-1 justify-content-center' : 'row-cols-2';
  }
}
