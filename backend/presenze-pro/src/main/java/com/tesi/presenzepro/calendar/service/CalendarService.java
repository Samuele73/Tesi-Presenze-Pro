package com.tesi.presenzepro.calendar.service;

import com.tesi.presenzepro.calendar.mapper.CalendarMapper;
import com.tesi.presenzepro.calendar.repository.CalendarRepository;
import com.tesi.presenzepro.calendar.CalendarResponseEntry;
import com.tesi.presenzepro.calendar.model.Calendar;
import com.tesi.presenzepro.jwt.JwtUtils;
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

    public boolean saveNewCalendarEntry(Calendar calendarData){
        Calendar ciao = this.repository.save(calendarData);
        System.out.println("IL CAlendaRIO qui: " + ciao);
        return false;
    }

    public List<CalendarResponseEntry> retrieveAllUserEntries(HttpServletRequest request){
        final String authHeader = request.getHeader("Authorization");
        if(authHeader == null)
            return null;
        final String tkn = authHeader.substring(7);
        final String userEmail = jwtUtils.getUsernameFromJwt(tkn);
        List<Calendar> calendars = repository.findAllByUserId(userEmail);
        return calendarMapper.fromCalendarsToCalendarEntries(calendars);
    }
}
