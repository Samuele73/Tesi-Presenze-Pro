package com.tesi.presenzepro.calendar;

import com.tesi.presenzepro.calendar.model.CalendarEntry;
import com.tesi.presenzepro.calendar.model.CalendarEntryType;

public record CalendarResponseEntry(
        CalendarEntryType entryType,
        CalendarEntry entry
) {
}
