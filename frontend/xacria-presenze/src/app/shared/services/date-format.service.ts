import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { UserRequestResponseDto } from 'src/generated-client';

@Injectable({
  providedIn: 'root',
})
export class DateFormatService {
  constructor() {}

  // Estrae solo YYYY-MM-DD
  formatToDateInput(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }

  manuallyFormatToDateInput(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  formatDateString(date: string): string {
    return date.split('T')[0];
  }

  normalizeDate(date: Date | string): Date {
    // Make sure it is of type Date
    const d = date instanceof Date ? date : new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  areDatesEqual(x: any, y: any): boolean {
    if (!x || !y) return false;

    const d1 = new Date(x);
    const d2 = new Date(y);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  formatDateTimeBasedOnRequest(
    date: Date | undefined,
    requestType: UserRequestResponseDto.TypeEnum | undefined,
    noTime: boolean = false
  ): string {
    if (!date || !requestType) {
      return '—';
    }
    if (requestType == 'TRASFERTA' || requestType == 'FERIE' || noTime)
      return formatDate(date, 'dd-MM-yyyy', 'en-GB');
    return formatDate(date, 'dd-MM-yyyy HH:mm', 'en-GB');
  }

  getTimeFromDate(date: Date | undefined): string {
    if (!date) {
      return '—';
    }
    return formatDate(date, 'HH:mm', 'en-GB');
  }

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }
}
