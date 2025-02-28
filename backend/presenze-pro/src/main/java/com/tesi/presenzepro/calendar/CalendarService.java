package com.tesi.presenzepro.calendar;

import com.tesi.presenzepro.jwt.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.http.HttpHeaders;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CalendarService {
    private final CalendarRepository repository;
    private final JwtService jwtService;
    private final CalendarMapper calendarMapper;

    boolean saveNewCalendarEntry(Calendar calendarData){
        Calendar ciao = this.repository.save(calendarData);
        System.out.println("IL CAlendaRIO qui: " + ciao);
        return false;
    }

    List<CalendarResponseEntry> retrieveAllUserEntries(HttpServletRequest request){
        final String authHeader = request.getHeader("Authorization");
        if(authHeader == null)
            return null;
        final String tkn = authHeader.substring(7);
        final String userEmail = jwtService.extractEmail(tkn);
        List<Calendar> calendars = repository.findAllByUser(userEmail);
        return calendarMapper.fromCalendarsToCalendarEntries(calendars);
    }
}
