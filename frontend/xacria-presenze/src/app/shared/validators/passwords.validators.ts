import { AbstractControl, ValidationErrors } from "@angular/forms";


export class passwordValidators{

  static equalPasswords(controlName1: string, controlName2: string){
    return (control: AbstractControl) => {
      const password1: string = control.get(controlName1)?.value as string;
      const password2: string = control.get(controlName2)?.value as string;
      console.log("CONTROLLO LE PWD")
      if(password1 === password2)
        return null;
      return {equalPasswordsValidator: true};
    }
  }
}
