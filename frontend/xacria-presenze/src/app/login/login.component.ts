import { Component } from '@angular/core';
import {
  FormGroup,
  FormControl,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { LoginRequestDto } from 'src/generated-client';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm!: FormGroup;
  areCredentialsInvalid: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.setLoginForm();
  }

  get emailControl() {
    return this.loginForm.get('email');
  }
  get passwordControl() {
    return this.loginForm.get('password');
  }

  setLoginForm(): void {
    this.loginForm = this.formBuilder.group({
      email: [
        '',
        [
          Validators.required,
          Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,}$'),
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  loginFormSubmit(): void {
    if (this.loginForm.invalid) return;
    console.log('LoginForm submitted!');
    const userCredentials: LoginRequestDto = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };
    this.makeLoginRequest(userCredentials);
  }

  makeLoginRequest(userCredentials: LoginRequestDto) {
    /* console.log(this.authService.login(userCredentials)); */
    this.authService.login(userCredentials).subscribe({
      next: (resp: any) => {
        if (resp) {
          this.authService.email = resp.email;
          console.log('PER FAVORE GUARDA LOGIN:::::::', this.authService.email);
          this.router.navigate(['/app']);
        }
      },
      error: (err: any) => {
        console.error('Login error: ', err);
        this.areCredentialsInvalid = true;
      },
    });
  }
}
