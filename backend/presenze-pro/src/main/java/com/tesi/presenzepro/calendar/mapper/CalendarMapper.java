package com.tesi.presenzepro.calendar.mapper;

import com.tesi.presenzepro.calendar.dto.CalendarResponseEntry;
import com.tesi.presenzepro.calendar.model.CalendarEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CalendarMapper {
    public List<CalendarResponseEntry> fromCalendarsToCalendarEntries(List<CalendarEntity> entries){
         return entries.stream().map(entry -> {
                return new CalendarResponseEntry(entry.getEntryType(), entry.getCalendarEntry());
            }
         ).collect(Collectors.toList());
    }
}
