import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UserService, UserVacationHours } from 'src/generated-client';

type userVacationValues = {
  annualLeaveDays?: number,
  annualPermitHours?: number
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit{
  userVacationHours?: userVacationValues;

  constructor(public authService: AuthService, private userService: UserService, private toastrService: ToastrService){}

  ngOnInit(): void {
    this.userService.getMyRemainingHolidayHours().subscribe({
      next: (value: UserVacationHours) => {
        console.log("check", value);

        let annualLeaveDays = value.annualLeaveHours;
        if(value.annualLeaveHours)
          annualLeaveDays = value.annualLeaveHours / 24;
        this.userVacationHours = {
          annualLeaveDays: annualLeaveDays,
          annualPermitHours: value.annualPermitHours
        };
      },
      error: (err: HttpErrorResponse) => {
        this.toastrService.error("Problema con il reperiemento dei valori delle pie");
      }
    })
  }


}
