package com.tesi.presenzepro.calendar.service;

import com.tesi.presenzepro.calendar.dto.SaveCalendarEntryDto;
import com.tesi.presenzepro.calendar.mapper.CalendarMapper;
import com.tesi.presenzepro.calendar.repository.CalendarRepository;
import com.tesi.presenzepro.calendar.CalendarResponseEntry;
import com.tesi.presenzepro.calendar.model.Calendar;
import com.tesi.presenzepro.jwt.JwtUtils;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarService {
    private final CalendarRepository repository;
    private final JwtUtils jwtUtils;
    private final CalendarMapper calendarMapper;

    public Calendar saveNewCalendarEntry(SaveCalendarEntryDto calendarData){
        return this.repository.save(Calendar.builder()
                .userEmail(calendarData.userEmail())
                .calendarEntry(calendarData.calendarEntry())
                .entryType(calendarData.entryType())
                .build());
    }

    public List<CalendarResponseEntry> retrieveAllUserEntries(HttpServletRequest request){
        final String tkn = jwtUtils.getJwtFromHeader(request);
        if(tkn == null){
            throw new JwtException("token is null");
        }
        final String userEmail = jwtUtils.getUsernameFromJwt(tkn);
        List<Calendar> calendars = repository.findAllByUserEmail(userEmail);
        return calendarMapper.fromCalendarsToCalendarEntries(calendars);
    }
}
