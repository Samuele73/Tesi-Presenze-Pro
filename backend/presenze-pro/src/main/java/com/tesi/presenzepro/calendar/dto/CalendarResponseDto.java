package com.tesi.presenzepro.calendar.dto;

import com.tesi.presenzepro.calendar.model.CalendarEntry;
import com.tesi.presenzepro.calendar.model.CalendarEntryType;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Oggetto in risposta a risposta di fetching di entires del calendario")
public record CalendarResponseDto(
        String id,
        CalendarEntryType entryType,
        CalendarEntry calendarEntry
) {
}
