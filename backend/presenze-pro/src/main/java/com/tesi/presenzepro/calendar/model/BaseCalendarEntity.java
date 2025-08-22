package com.tesi.presenzepro.calendar.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class BaseCalendarEntity {
    protected CalendarEntryType entryType;
    protected CalendarEntry calendarEntry;
}
