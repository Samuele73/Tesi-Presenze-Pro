package com.tesi.presenzepro.calendar.service;

import com.tesi.presenzepro.calendar.mapper.CalendarMapper;
import com.tesi.presenzepro.calendar.repository.CalendarRepository;
import com.tesi.presenzepro.calendar.dto.CalendarResponseDto;
import com.tesi.presenzepro.calendar.model.CalendarEntity;
import com.tesi.presenzepro.exception.CalendarEntityNotFound;
import com.tesi.presenzepro.jwt.JwtUtils;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarService {
    private final CalendarRepository repository;
    private final JwtUtils jwtUtils;
    private final CalendarMapper calendarMapper;
    private final MongoTemplate mongoTemplate;

    public CalendarResponseDto saveNewCalendarEntry(CalendarEntity calendarEntityData){
        CalendarEntity calendarEntity =  this.repository.save(calendarEntityData);
        return calendarMapper.fromCalendarToCalendarEntry(calendarEntity);
    }

    private String getUserEmailFromRequest(HttpServletRequest request){
        final String tkn = jwtUtils.getJwtFromHeader(request);
        if(tkn == null){
            throw new JwtException("token is null");
        }
        return jwtUtils.getUsernameFromJwt(tkn);
    }

    public List<CalendarResponseDto> getAllUserEntries(HttpServletRequest request){
        final String userEmail = this.getUserEmailFromRequest(request);
        List<CalendarEntity> calendarEntities = repository.findAllByUserEmail(userEmail);
        System.out.println("LOOK BEFORE" + calendarEntities);
        System.out.println("LOOK" + calendarMapper.fromCalendarsToCalendarEntries(calendarEntities));
        return calendarMapper.fromCalendarsToCalendarEntries(calendarEntities);
    }

    private Date[] getMonthStartAndEnd(int month, int year){
        Calendar cal = Calendar.getInstance();

        // Imposta l'inizio del mese
        cal.set(Calendar.YEAR, year);
        cal.set(Calendar.MONTH, month - 1); // gennaio = 0
        cal.set(Calendar.DAY_OF_MONTH, 1);
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        Date start = cal.getTime();

        // Imposta la fine del mese
        cal.set(Calendar.DAY_OF_MONTH, cal.getActualMaximum(Calendar.DAY_OF_MONTH));
        cal.set(Calendar.HOUR_OF_DAY, 23);
        cal.set(Calendar.MINUTE, 59);
        cal.set(Calendar.SECOND, 59);
        cal.set(Calendar.MILLISECOND, 999);
        Date end = cal.getTime();
        return new Date[]{start, end};
    }

    public List<CalendarResponseDto> getUserEntriesByMonthYear(HttpServletRequest request, Integer month, Integer year) {
        final String userEmail = this.getUserEmailFromRequest(request);
        final Date[] monthStartAndEnd = getMonthStartAndEnd(month, year);
        final List<CalendarEntity> calendarEntries = repository.findByUserEmailAndDateFromBetween(userEmail, monthStartAndEnd[0], monthStartAndEnd[1]);
        return calendarMapper.fromCalendarsToCalendarEntries(calendarEntries);
    }

    private CalendarEntity getCalendarEntity(String entityId, String userEmail){
        return repository
                .findByUserEmailAndId(userEmail, entityId)
                .orElseThrow(() -> new CalendarEntityNotFound(entityId));
    }

    public CalendarResponseDto deleteCalendarEntry(HttpServletRequest request , String entityId) {
        final String userEmail = this.getUserEmailFromRequest(request);
        CalendarEntity entity = getCalendarEntity(entityId, userEmail);
        repository.delete(entity);
        return calendarMapper.fromCalendarToCalendarEntry(entity);
    }

    private CalendarEntity updateCalendarEntityById(String id, CalendarEntity calendarEntity){
        Query query = new Query(Criteria.where("_id").is(id));

        Update update = new Update()
                .set("calendarEntry", calendarEntity.getCalendarEntry())
                .set("entryType", calendarEntity.getEntryType());

        CalendarEntity updated = mongoTemplate.findAndModify(
                query,
                update,
                FindAndModifyOptions.options().returnNew(true), // ritorna il nuovo documento
                CalendarEntity.class
        );

        if(updated == null){
            throw new CalendarEntityNotFound(id);
        }

        return updated;
    }

    public CalendarResponseDto updateCalendarEntity(HttpServletRequest request , String entityId, CalendarEntity updatedCalendarEntity) {
        final String userEmail = this.getUserEmailFromRequest(request);
        //CalendarEntity entity = getCalendarEntity(entityId, userEmail);
        final CalendarEntity newCalendarEntity = this.updateCalendarEntityById(entityId, updatedCalendarEntity);
        return calendarMapper.fromCalendarToCalendarEntry(newCalendarEntity);
    }
}
