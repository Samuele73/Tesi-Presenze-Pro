import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/shared/services/auth.service';
import {
  ApprovalRequestTab,
  CalendarService,
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
    private calendarService: CalendarService
  ) {}

  ngOnInit(): void {
    this.getRemainingHolidayHours();
    this.getRequestsFromAPi();
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
    this.calendarService
      .getAllRequests({ page: 0, size: 10 }, 'OPEN')
      .subscribe({
        next: (requests: PagedResponseUserRequestResponseDto) => {
          this.requestsByTab['OPEN'] = requests;
        },
        error: (err: HttpErrorResponse) => {
          this.toastrService.error(err.error.message);
        },
      });
    this.calendarService
      .getAllRequests({ page: 0, size: 10 }, 'CLOSED')
      .subscribe({
        next: (requests: PagedResponseUserRequestResponseDto) => {
          this.requestsByTab['CLOSED'] = requests;
        },
        error: (err: HttpErrorResponse) => {
          this.toastrService.error(err.error.message);
        },
      });
  }
}
