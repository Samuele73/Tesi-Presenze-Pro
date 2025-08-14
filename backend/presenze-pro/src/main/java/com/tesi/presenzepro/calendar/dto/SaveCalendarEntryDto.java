package com.tesi.presenzepro.calendar.dto;

import com.tesi.presenzepro.calendar.model.CalendarEntry;
import com.tesi.presenzepro.calendar.model.CalendarEntryType;

public record SaveCalendarEntryDto(
        String userEmail,
        CalendarEntryType entryType,
        CalendarEntry calendarEntry
) {
}
