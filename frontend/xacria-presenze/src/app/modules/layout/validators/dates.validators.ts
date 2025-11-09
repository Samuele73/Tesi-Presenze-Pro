import { AbstractControl, ValidationErrors } from "@angular/forms";


export class datesValidators{

  static matchedDates(from_date_control: string, to_date_control: string){
    return (control: AbstractControl) => {
      const from_date: Date = control.get(from_date_control)?.value as Date;
      const to_date: Date = control.get(to_date_control)?.value as Date;
      console.log("from_date: ", from_date);
      console.log("to_date", to_date);
      if(to_date > from_date)
        return null;
      return {dateMatchValidator: true};
    }
  }
}
