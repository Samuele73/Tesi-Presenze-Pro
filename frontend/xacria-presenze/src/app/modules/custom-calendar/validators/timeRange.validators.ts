import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function timeRangeValidator(
  timeFromField: string,
  timeToField: string
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const hourFrom = group.get(timeFromField)?.value;
    const hourTo = group.get(timeToField)?.value;

    console.log('STO CONTROLLANDO l orario');

    if (!hourFrom || !hourTo) return null;

    // Assumo formato stringa "HH:mm" oppure numero
    if (hourFrom > hourTo) {
      return { invalidTimeRange: true };
    }

    return null;
  };
}
