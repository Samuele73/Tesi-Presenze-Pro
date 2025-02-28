package com.tesi.presenzepro.calendar;

public record CalendarResponseEntry(
        CalendarEntryType entryType,
        CalendarEntry entry
) {
}
