import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  Form,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Username } from '../../../layout/shared/models/username';
import { UsernameService } from '../../../layout/shared/services/username.service';
import {
  BasicUserProfileResponse,
  FullUserProfileResponseDto,
  User,
  UserProfile,
  UserService,
} from 'src/generated-client';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

type ProfileMode = 'FULL' | 'BASIC' | 'ME';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  user!: FullUserProfileResponseDto; //cambiare il tipo
  @Output() newUsername = new EventEmitter<{ name: string; surname: string }>();
  mode: ProfileMode = 'BASIC';
  error: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private usernameService: UsernameService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.retrieveUserCreds();
  }

  get name() {
    return this.profileForm.get('name');
  }
  get surname() {
    return this.profileForm.get('surname');
  }
  get serial_num() {
    return this.profileForm.get('serial_num');
  }
  get duty() {
    return this.profileForm.get('duty');
  }
  get employment_type() {
    return this.profileForm.get('employment_type');
  }
  get hire_date() {
    return this.profileForm.get('hire_date');
  }
  get email() {
    return this.profileForm.get('email');
  }
  get iban() {
    return this.profileForm.get('iban');
  }
  get birth_date() {
    return this.profileForm.get('birth_date');
  }
  get address() {
    return this.profileForm.get('address');
  }
  get phone() {
    return this.profileForm.get('phone');
  }

  setProfileForm(): void {
    console.log('USER profile:', this.user);
    if (this.mode === 'FULL' || this.mode === 'ME') {
      this.profileForm = this.formBuilder.group({
        name: [this.user?.name ?? '', []],
        surname: [this.user?.surname ?? '', []],
        serial_num: [this.user?.serialNum ?? '', []],
        duty: [this.user?.duty ?? '', []],
        employment_type: [this.user?.employmentType ?? '', []],
        hire_date: [
          this.user?.hireDate
            ? this.user.hireDate.toString().split('T', 1)[0]
            : '',
          [],
        ],
        email: [
          this.user?.email ?? '',
          [
            Validators.required,
            Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$'),
          ],
        ],
        iban: [
          this.user?.iban ?? '',
          [Validators.minLength(5), Validators.maxLength(34)],
        ],
        birth_date: [
          this.user?.birthDate
            ? this.user.birthDate.toString().split('T', 1)[0]
            : '',
          [],
        ],
        address: [this.user?.address ?? '', []],
        phone: [this.user?.phone ?? '', []],
      });
    } else if (this.mode === 'BASIC') {
      this.profileForm = this.formBuilder.group({
        name: [this.user?.name ?? '', []],
        surname: [this.user?.surname ?? '', []],
        email: [
          this.user?.email ?? '',
          [
            Validators.required,
            Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$'),
          ],
        ],
      });
    }
  }

  retrieveUserCreds(): void {
    this.mode = this.route.snapshot.queryParamMap.get('mode') as ProfileMode;
    const userEmail: string | null =
      this.route.snapshot.queryParamMap.get('email');

    if (!userEmail && this.mode !== 'ME') {
      this.error = 'Nessuna email presente nella richiesta';
      return;
    }

    const call$ =
      this.mode === 'BASIC'
        ? this.userService.getBasicUserProfile(userEmail!)
        : this.mode === 'FULL'
        ? this.userService.getFullUserProfile(userEmail!)
        : this.userService.getMyUserProfile();

    call$.subscribe({
      next: (resp) => {
        this.user = resp;
        this.setProfileForm();
      },
      error: () => {
        this.error = 'Errore nella richiesta del profilo utente';
      },
    });
  }

  onProfileFormSubmit(): void {
    if (this.profileForm.invalid) return;
    console.log('Profile form submitted!');
    const tmp_user: User = this.getAllUserCreds();
    this.authService.updateCreds(tmp_user).subscribe({
      next: (user: FullUserProfileResponseDto) => {
        this.user = user;
        this.setProfileForm();
        this.emitChangedUsername({
          name: user.name || '',
          surname: user.surname || '',
        });
      },
      error: (err: any) => {
        console.log('Error in Profile update: ', err);
      },
    });
    /* window.location.reload(); */
  }

  //Returns an UserCreds object with values from profileForm and userCreds variable (because contains password)
  getAllUserCreds(): User {
    return {
      email: this.user.email,
      profile: {
        name: this.name?.value,
        surname: this.surname?.value,
        serialNum: this.serial_num?.value,
        employmentType: this.employment_type?.value,
        hireDate: this.hire_date?.value,
        duty: this.duty?.value,
        iban: this.iban?.value,
        birthDate: this.birth_date?.value,
        address: this.address?.value,
        phone: this.phone?.value,
      },
      data: {
        assignedProjects: [],
      },
    };
    /* return {
      name: this.name?.value,
      surname: this.surname?.value,
      email: this.user.email,
      duty: this.duty?.value,
      serialNum: this.serial_num?.value,
      employmentType: this.employment_type?.value,
      hireDate: this.hire_date?.value,
      iban: this.iban?.value,
      birthDate: this.birth_date?.value,
      address: this.address?.value,
      phone: this.phone?.value
    }; */
  }

  emitChangedUsername(newUsername: Username) {
    this.usernameService.emitChange(newUsername);
  }
}
