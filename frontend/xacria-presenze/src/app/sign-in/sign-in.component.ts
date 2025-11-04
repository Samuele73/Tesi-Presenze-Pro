import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SignInRequestDto, UserService } from 'src/generated-client';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
  signinForm!: FormGroup;
  apiError?: string;
  userEmail: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private route: ActivatedRoute
  ) {
    this.setSigninForm();
  }

  ngOnInit(): void {
    this.setInvitedEmailFromTkn()
  }

  setInvitedEmailFromTkn(): void {
    const tkn: string | null = this.route.snapshot.queryParamMap.get('token');
    if (tkn) {
      this.userService.getEmailFromInvitation(tkn).subscribe({
        next: (email: string) => {
          this.userEmail = email;
          this.signinForm.patchValue({email: this.userEmail})
        },
        error: (err: HttpErrorResponse) => {
          this.apiError = err.error.message;
        }
      })
      return;
    }
    this.apiError = "Nessun token presente!"
  }

  get nameControl() {
    return this.signinForm.get('name');
  }
  get surnameControl() {
    return this.signinForm.get('surname');
  }
  get emailControl() {
    return this.signinForm.get('email');
  }
  get passwordControl() {
    return this.signinForm.get('password');
  }

  setSigninForm(): void {
    this.signinForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      surname: ['', [Validators.required]],
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

  signinFormSubmit(): void {
    if (this.signinForm.invalid) return;
    console.log('Singin form submitted!');
    const userCredentials: SignInRequestDto = {
      name: this.signinForm.value.name,
      surname: this.signinForm.value.surname,
      email: this.signinForm.value.email,
      password: this.signinForm.value.password,
    };
    this.makeSigninRequest(userCredentials);
  }

  makeSigninRequest(userCredentials: SignInRequestDto) {
    this.authService.signin(userCredentials).subscribe({
      next: (resp: any) => {
        console.log('Signin response:', resp);
        if (resp) {
          this.router.navigate(['login']);
        }
      },
      error: (err: any) => {
        console.error('Error during signin:', err.message);
        this.apiError = err.message;
      },
    });
  }
}
