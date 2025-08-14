package com.tesi.presenzepro.calendar.model;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.swagger.v3.oas.annotations.media.Schema;

//@JsonTypeInfo(use=JsonTypeInfo.Id.NAME, property = "type")
//@JsonSubTypes({
//        @JsonSubTypes.Type(value = CalendarRequestEntry.class, name = "CalendarRequestEntry"),
//        @JsonSubTypes.Type(value = CalendarWorkingDayEntry.class, name = "CalendarWorkingDayEntry"),
//        @JsonSubTypes.Type(value = CalendarWorkingTripEntry.class, name = "CalendarWorkingTripEntry"),
//        @JsonSubTypes.Type(value = CalendarAvailabilityEntry.class, name = "CalendarAvailabilityEntry")
//})
@Schema(description = "Interfaccia base per le varie entry del calendario")
public interface CalendarEntry {
}
