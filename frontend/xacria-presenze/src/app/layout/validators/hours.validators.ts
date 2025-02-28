import { AbstractControl, FormArray, FormControl, ValidationErrors } from "@angular/forms";


export class hoursValidators {

  static matchedHours(from_hour: string, to_hour: string){
    return (control: AbstractControl) => {
      const from_whour1: string = control.get(from_hour)?.value as string;
      const to_whour1: string = control.get(to_hour)?.value as string;
      /* if(!from_whour1 && !to_whour1)
        return null; */
      /* console.log(from_whour1, " ::: ", to_whour1) debugging*/
      const parsed_hours_from: string[] = from_whour1.split(":");
      const parsed_hours_to: string[] = to_whour1.split(":");
      if((parsed_hours_from[0] < parsed_hours_to[0]) || (parsed_hours_from[0] == parsed_hours_to[0] && parsed_hours_from[1] < parsed_hours_to[1]))
        return null;
      /* console.log("non valido"); debugging*/
      return { hoursMatchValidator: true};
    }
  }

  static matchedHoursFromArray(from_hour_index: AbstractControl | null, to_hour_index: AbstractControl | null){
    return (control: AbstractControl) => {
      if(from_hour_index == null || to_hour_index == null)
        return null;
      const formArray = control as FormArray;
      const from_whour1: string = from_hour_index.value as string;
      const to_whour1: string = to_hour_index.value as string;
      console.log("FROM WHOUR DA ARRAY: ", from_whour1, to_whour1)
      if(!from_whour1 && !to_whour1)
        return null;
      /* console.log(from_whour1, " ::: ", to_whour1) debugging*/
      const parsed_hours_from: string[] = from_whour1.split(":");
      const parsed_hours_to: string[] = to_whour1.split(":");
      if((parsed_hours_from[0] < parsed_hours_to[0]) || (parsed_hours_from[0] == parsed_hours_to[0] && parsed_hours_from[1] < parsed_hours_to[1]))
        return null;
      /* console.log("non valido"); debugging*/
      return { hoursMatchValidator: true};
    }
  }
}
