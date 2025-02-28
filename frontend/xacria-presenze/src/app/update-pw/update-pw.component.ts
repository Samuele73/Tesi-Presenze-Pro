import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { passwordValidators } from '../shared/validators/passwords.validators';

@Component({
  selector: 'app-update-pw',
  templateUrl: './update-pw.component.html',
  styleUrls: ['./update-pw.component.scss']
})
export class UpdatePwComponent implements OnInit{
  updatePasswordForm!: FormGroup;
  serverError: boolean = false;
  authToken: string = "";

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router, private route: ActivatedRoute){
    this.setUpdatePasswordForm();
  }

  get password2Control(){return this.updatePasswordForm.get("password2");}
  get passwordControl(){return this.updatePasswordForm.get("password");}


  ngOnInit(): void {
      this.route.queryParams.subscribe(params => {
        this.authToken = params["token"];
      })
  }

  setUpdatePasswordForm(): void{
    this.updatePasswordForm = this.formBuilder.group({
      password: ["",[
        Validators.required
      ]],
      password2: ["", [
        Validators.required
      ]]
    }, {validators: passwordValidators.equalPasswords("password", "password2")});
  }

  updatePasswordFormSubmit(): void{
    if(this.updatePasswordForm.invalid){
      console.error("Update form not valid!");
      return;
    }
    console.log("Update form submitted!");
    this.makeChangePasswordRequest(this.updatePasswordForm.value.password);
  }

  makeChangePasswordRequest(newPassword: string){
    if(!this.authToken.length){
      console.error("Token is empty. No permission to change the password");
      return;
    }
    console.log("L'AUTH TOKEN: ", this.authToken);
    const newPasswordRequest: object = {
      password: newPassword,
      token: this.authToken
    }
    this.authService.updatePassword(newPasswordRequest).subscribe({
      next: (resp: any) => {
        console.log("Password has been updated");
        this.serverError = false;
        this.router.navigate(["login"]);
      },
      error: (err: any) => {
        console.error("Error in update password request. this is the response from the server:", err);
        this.serverError = true;
      }
    })
    /* if(this.authService.changePassword(email))
      this.router.navigate(["login"]);
    else
      this.isSubmittedEmailWrong = true; */
  }
}
