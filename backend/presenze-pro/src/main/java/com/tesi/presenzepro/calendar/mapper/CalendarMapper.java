package com.tesi.presenzepro.calendar.mapper;

import com.tesi.presenzepro.calendar.dto.CalendarResponseDto;
import com.tesi.presenzepro.calendar.dto.SaveCalendarEntityRequestDto;
import com.tesi.presenzepro.calendar.dto.UserRequestResponseDto;
import com.tesi.presenzepro.calendar.model.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
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

    public CalendarResponseDto fromCalendarEntityToCalendarEntry(CalendarEntity entity){
        return new CalendarResponseDto(entity.getId() ,entity.getEntryType(), entity.getCalendarEntry());
    }

    public List<CalendarResponseDto> fromCalendarEntitiesToCalendarEntries(List<CalendarEntity> entities){
        return entities.stream()
                .map(this::fromCalendarEntityToCalendarEntry)
                .collect(Collectors.toList());
    }

    public CalendarEntity fromCalendarSaveRequestToEntity(SaveCalendarEntityRequestDto requestDto){
        return CalendarEntity.builder().calendarEntry(requestDto.getCalendarEntry()).entryType(requestDto.getEntryType()).build();
    }

    public List<CalendarEntity> fromCalendarSaveRequestToEntities(List<SaveCalendarEntityRequestDto> requestDtos){
        return requestDtos.stream()
                .map(this::fromCalendarSaveRequestToEntity)
                .collect(Collectors.toList());
    }

    private LocalTime parseTime(String time) {
        try {
            return LocalTime.parse(time); // Es. "08:30" → 08:30
        } catch (Exception e) {
            return LocalTime.MIDNIGHT; // fallback se il campo è nullo o malformato
        }
    }

    public UserRequestResponseDto mapToUserRequestResponseDto(CalendarEntity e) {
        if (e.getEntryType() == CalendarEntryType.REQUEST) {
            CalendarRequestEntry entry = (CalendarRequestEntry) e.getCalendarEntry();

            LocalDateTime from = LocalDateTime.of(
                    entry.getDateFrom().toInstant()
                            .atZone(ZoneOffset.UTC)
                            .toLocalDate(),
                    parseTime(entry.getTimeFrom())
            );
            LocalDateTime to = LocalDateTime.of(
                    entry.getDateTo().toInstant()
                            .atZone(ZoneOffset.UTC)
                            .toLocalDate(),
                    parseTime(entry.getTimeTo())
            );

            return UserRequestResponseDto.builder()
                    .id(e.getId())
                    .userEmail(e.getUserEmail())
                    .type(RequestType.valueOf(entry.getRequestType().toUpperCase()))
                    .dateFrom(from)
                    .dateTo(to)
                    .status(entry.getStatus())
                    .build();
        } else {
            CalendarWorkingTripEntry entry = (CalendarWorkingTripEntry) e.getCalendarEntry();

            LocalDateTime from = LocalDateTime.of(
                    entry.getDateFrom().toInstant()
                            .atZone(java.time.ZoneId.systemDefault())
                            .toLocalDate(),
                    LocalTime.MIDNIGHT
            );
            LocalDateTime to = LocalDateTime.of(
                    entry.getDateTo().toInstant()
                            .atZone(java.time.ZoneId.systemDefault())
                            .toLocalDate(),
                    LocalTime.MIDNIGHT
            );

            return UserRequestResponseDto.builder()
                    .id(e.getId())
                    .userEmail(e.getUserEmail())
                    .type(RequestType.TRASFERTA)
                    .dateFrom(from)
                    .dateTo(to)
                    .status(entry.getStatus())
                    .build();
        }
    }
}
