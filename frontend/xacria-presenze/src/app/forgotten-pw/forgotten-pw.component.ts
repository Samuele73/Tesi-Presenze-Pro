import { Component } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgotten-pw',
  templateUrl: './forgotten-pw.component.html',
  styleUrls: ['./forgotten-pw.component.scss']
})
export class ForgottenPwComponent {
  forgottenPwdForm!: FormGroup;
  isSubmittedEmailWrong: boolean = false;
  emailFound: boolean = false;

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router){
    this.setForgottenPwdForm();
  }

  get emailControl(){return this.forgottenPwdForm.get("email");}
  get passwordControl(){return this.forgottenPwdForm.get("password");}

  setForgottenPwdForm(): void{
    this.forgottenPwdForm = this.formBuilder.group({
      email: ["",[
        Validators.required,
        Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$")
      ]]
    });
  }

  forgottenPwdFormSubmit(): void{
    if(this.forgottenPwdForm.invalid){
      console.error("Forgotten-pwd form not valid!");
      return;
    }
    console.log("Forgotten-pwd form submitted!");
    this.makeChangePasswordRequest(this.forgottenPwdForm.value.email);
  }

  makeChangePasswordRequest(email: string){
    this.authService.changePassword(email).subscribe({
      next: (resp: any) => {
        console.log("email found: ", resp);
        this.emailFound = true;
        this.isSubmittedEmailWrong = false;
      },
      error: (err: any) => {
        console.error("Error in reset password request. this is the response from the server:", err);
        this.isSubmittedEmailWrong = true;
      }
    })
    /* if(this.authService.changePassword(email))
      this.router.navigate(["login"]);
    else
      this.isSubmittedEmailWrong = true; */
  }
}
