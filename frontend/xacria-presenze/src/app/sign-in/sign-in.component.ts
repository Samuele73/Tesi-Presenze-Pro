import { Component } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
import { Router } from '@angular/router';
import { userCredentials } from '../shared/models/userModel';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent {
  signinForm!: FormGroup;

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router){
    this.setSigninForm();
  }

  get nameControl(){return this.signinForm.get("name");}
  get surnameControl(){return this.signinForm.get("surname");}
  get emailControl(){return this.signinForm.get("email");}
  get passwordControl(){return this.signinForm.get("password");}

  setSigninForm(): void{
    this.signinForm = this.formBuilder.group({
      name: ["", [
        Validators.required
      ]],
      surname: ["", [
        Validators.required
      ]],
      email: ["", [
        Validators.required,
        Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$")
      ]],
      password: ["", [
        Validators.required,
        Validators.minLength(8)
      ]]
    })
  }

  signinFormSubmit(): void{
    if(this.signinForm.invalid)
      return;
    console.log("Singin form submitted!");
    const userCredentials: userCredentials = {
      name: this.signinForm.value.name,
      surname: this.signinForm.value.surname,
      email: this.signinForm.value.email,
      password: this.signinForm.value.password
    }
    this.makeSigninRequest(userCredentials);
  }

  makeSigninRequest(userCredentials: userCredentials){
    if(this.authService.signin(userCredentials))
      this.router.navigate(["login"]);
  }
}
