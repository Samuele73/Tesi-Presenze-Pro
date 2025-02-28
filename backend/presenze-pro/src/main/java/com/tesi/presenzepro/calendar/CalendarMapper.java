package com.tesi.presenzepro.calendar;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CalendarMapper {
    List<CalendarResponseEntry> fromCalendarsToCalendarEntries(List<Calendar> entries){
         return entries.stream().map(entry -> {
                return new CalendarResponseEntry(entry.getEntryType(), entry.getCalendarEntry());
            }
         ).collect(Collectors.toList());
    }
}
