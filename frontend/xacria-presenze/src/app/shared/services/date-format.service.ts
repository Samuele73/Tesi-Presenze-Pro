import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateFormatService {

  constructor() { }

  // Estrae solo YYYY-MM-DD
  formatToDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDateString(date: string): string{
    return date.split('T')[0];
  }

  normalizeDate(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
