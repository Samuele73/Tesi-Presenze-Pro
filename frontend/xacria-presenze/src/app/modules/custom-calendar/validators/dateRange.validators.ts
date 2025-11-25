import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateRangeValidator(
  dateFromField: string,
  dateToField: string
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const dateFromRaw = group.get(dateFromField)?.value;
    const dateToRaw = group.get(dateToField)?.value;

    if (!dateFromRaw || !dateToRaw) return null;

    const dateFromClean = dateFromRaw.split('T')[0];
    const dateToClean = dateToRaw.split('T')[0];

    const dateFrom = new Date(dateFromClean);
    const dateTo = new Date(dateToClean);

    if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
      return { invalidDateFormat: true };
    }

    if (dateFrom > dateTo) {
      return { invalidDateRange: true };
    }

    return null;
  };
}
