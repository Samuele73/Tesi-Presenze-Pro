import { Component, EventEmitter, Output } from '@angular/core';
import { Form, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Username } from '../shared/models/username';
import { UsernameService } from '../shared/services/username.service';
import { User } from 'src/generated-client';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  profileForm!: FormGroup;
  user_creds!: any; //cambiare il tipo
  @Output() newUsername = new EventEmitter<{name: string, surname: string}>;

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private usernameService: UsernameService){
    this.user_creds = {};
    this.setProfileForm();
    this.retrieveUserCreds();
  }

  get name() {return this.profileForm.get("name");}
  get surname() {return this.profileForm.get("surname");}
  get serial_num() {return this.profileForm.get("serial_num");}
  get duty() {return this.profileForm.get("duty");}
  get employment_type() {return this.profileForm.get("employment_type");}
  get hire_date() {return this.profileForm.get("hire_date");}
  get email() {return this.profileForm.get("email");}
  get iban() {return this.profileForm.get("iban");}
  get birth_date() {return this.profileForm.get("birth_date");}
  get address() {return this.profileForm.get("address");}
  get phone() {return this.profileForm.get("phone");}

  setProfileForm(): void{
    this.profileForm = this.formBuilder.group({
      name: [this.user_creds.name, [

      ]],
      surname: [this.user_creds.surname, [

      ]],
      serial_num: [this.user_creds.serialNum, [

      ]],
      duty: [this.user_creds.duty, [

      ]],
      employment_type: [this.user_creds.employmentType, [

      ]],
      hire_date: [this.user_creds.hireDate, [

      ]],
      email: [this.user_creds.email , [
        Validators.required,
        Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$")
      ]],
      iban: [this.user_creds.iban, [
        Validators.minLength(5),
        Validators.maxLength(34)
      ]],
      birth_date: [this.user_creds.birthDate, [

      ]],
      address: [this.user_creds.address, [

      ]],
      phone: [this.user_creds.phone, [

      ]]
    })
  }

  retrieveUserCreds(): void{
    let userCreds = this.authService.getUserProfile();
    if(userCreds != null){
      userCreds.subscribe({
        next: (resp: any) => {
          console.log("PROFILE: ", resp);
          if(resp.hireDate)
            resp.hireDate = resp.hireDate.split("T", 1)[0];
          if(resp.birthDate)
            resp.birthDate = resp.birthDate.split("T", 1)[0];
          this.user_creds = resp;
          this.setProfileForm();
        },
        error: (err: any) => {
          console.log("ERRORE PROFILE: ", err);
        }
      })
    }
    console.log("User crdes from profile component: ", this.user_creds);

  }

  onProfileFormSubmit(): void{
    if(this.profileForm.invalid)
      return;
    console.log("Profile form submitted!");
    const tmp_user_creds: User = this.getAllUserCreds();
    this.authService.updateCreds(tmp_user_creds).subscribe({
      next: (resp: any) => {
        if(resp.new_creds.hireDate)
            resp.new_creds.hireDate = resp.new_creds.hireDate.split("T", 1)[0];
        if(resp.new_creds.birthDate)
          resp.new_creds.birthDate = resp.new_creds.birthDate.split("T", 1)[0];
        this.user_creds = resp.new_creds;
        this.setProfileForm();
        this.emitChangedUsername({name: resp.new_creds.name, surname: resp.new_creds.surname})
      },
      error: (err: any) => {
        console.log("Error in Profile update: ", err);
      }
    })
    /* window.location.reload(); */
  }

  //Returns an UserCreds object with values from profileForm and userCreds variable (because contains password)
  getAllUserCreds(): User{
    return {
      name: this.name?.value,
      surname: this.surname?.value,
      email: this.user_creds.email,
      duty: this.duty?.value,
      serialNum: this.serial_num?.value,
      employmentType: this.employment_type?.value,
      hireDate: this.hire_date?.value,
      iban: this.iban?.value,
      birthDate: this.birth_date?.value,
      address: this.address?.value,
      phone: this.phone?.value
    };
  }

  emitChangedUsername(newUsername: Username){
    this.usernameService.emitChange(newUsername);
  }

}
