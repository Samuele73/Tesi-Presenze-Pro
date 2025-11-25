import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const timeRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const hourFrom = control.get('hourFrom')?.value;
  const hourTo = control.get('hourTo')?.value;

  console.log("STO CONTROLLANDO l orario");


  if (!hourFrom || !hourTo) return null;

  // Assumo formato stringa "HH:mm" oppure numero
  if (hourFrom >= hourTo) {
    return { invalidTimeRange: true };
  }

  return null;
};
