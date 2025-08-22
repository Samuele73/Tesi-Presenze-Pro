package com.tesi.presenzepro.calendar.mapper;

import com.tesi.presenzepro.calendar.dto.CalendarResponseDto;
import com.tesi.presenzepro.calendar.dto.SaveCalendarEntityRequestDto;
import com.tesi.presenzepro.calendar.model.CalendarEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CalendarMapper {
    public List<CalendarResponseDto> fromCalendarsToCalendarEntries(List<CalendarEntity> entries){
         return entries.stream().map(entry -> {
                return new CalendarResponseDto(entry.getId() ,entry.getEntryType(), entry.getCalendarEntry());
            }
         ).collect(Collectors.toList());
    }

    public CalendarResponseDto fromCalendarToCalendarEntry(CalendarEntity entity){
        return new CalendarResponseDto(entity.getId() ,entity.getEntryType(), entity.getCalendarEntry());
    }

    public CalendarEntity fromCalendarSaveRequestToEntity(SaveCalendarEntityRequestDto requestDto){
        return CalendarEntity.builder().calendarEntry(requestDto.getCalendarEntry()).entryType(requestDto.getEntryType()).build();
    }
}
