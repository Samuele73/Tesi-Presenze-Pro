import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateFormatService {

  constructor() { }

  // Estrae solo YYYY-MM-DD
  formatToDateInput(date: Date | string): string {
    const d = (date instanceof Date) ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }

  formatDateString(date: string): string{
    return date.split('T')[0];
  }

  normalizeDate(date: Date | string): Date {
    // Make sure it is of type Date
    const d = (date instanceof Date) ? date : new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
}
