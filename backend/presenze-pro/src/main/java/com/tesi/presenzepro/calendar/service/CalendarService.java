package com.tesi.presenzepro.calendar.service;

import com.tesi.presenzepro.calendar.dto.*;
import com.tesi.presenzepro.calendar.mapper.CalendarMapper;
import com.tesi.presenzepro.calendar.model.*;
import com.tesi.presenzepro.calendar.repository.CalendarRepository;
import com.tesi.presenzepro.exception.CalendarEntityNotFound;
import com.tesi.presenzepro.exception.NoUserFoundException;
import com.tesi.presenzepro.jwt.JwtUtils;
import com.tesi.presenzepro.user.service.UserService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalTime;

import java.security.InvalidParameterException;
import java.time.LocalDateTime;
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
    private final UserService userService;

    public CalendarResponseDto saveNewCalendarEntry(HttpServletRequest request ,SaveCalendarEntityRequestDto calendarEntityData){
        CalendarEntity newCalendarEntity = calendarMapper.fromCalendarSaveRequestToEntity(calendarEntityData);
        String userEmail = this.getUserEmailFromRequest(request);
        newCalendarEntity.setUserEmail(userEmail);
        this.applyDefaultStatus(newCalendarEntity);
        CalendarEntity calendarEntity =  this.repository.save(newCalendarEntity);
        return calendarMapper.fromCalendarEntityToCalendarEntry(calendarEntity);
    }

    private void applyDefaultStatus(CalendarEntity entity) {
        if (entity.getCalendarEntry() instanceof CalendarRequestEntry requestEntry) {
            System.out.println("Applying default calendar entry: " + entity.toString());
            requestEntry.setStatus(RequestStatus.PENDING);
        } else if (entity.getCalendarEntry() instanceof CalendarWorkingTripEntry tripEntry) {
            tripEntry.setStatus(RequestStatus.PENDING);
        }
    }

    public PagedResponse<UserRequestResponseDto> getAllUserRequests(
            HttpServletRequest request,
            Pageable pageable,
            List<RequestType> types,
            List<String> users,
            ApprovalRequestTab tab
    ) {
        final String jwt = jwtUtils.getJwtFromHeader(request);
        if (jwt == null) {
            throw new IllegalArgumentException("Missing JWT token in request header");
        }

        // se ci sono problemi con la coerenza dei dati in tabella controlla qui
        // Fa si che otttengo solo le entry permesse in base al ruolo. Direttamente collegato alle email che ottengo nel filtro
        final List<String> toFilterEmails = users == null ? this.userService.getRoleBasedUsersEmail() : users;

        Page<CalendarEntity> entities = repository.findFilteredRequests(types, toFilterEmails, pageable, tab);
        System.out.println("entities: " + entities.getContent());

        List<UserRequestResponseDto> dtos = entities.getContent().stream()
                .map(calendarMapper::mapToUserRequestResponseDto)
                .toList();

        return PagedResponse.<UserRequestResponseDto>builder()
                .content(dtos)
                .page(entities.getNumber())
                .size(entities.getSize())
                .totalElements(entities.getTotalElements())
                .totalPages(entities.getTotalPages())
                .last(entities.isLast())
                .build();
    }


    public PagedResponse<UserRequestResponseDto> getMyRquests(
            HttpServletRequest request,
            Pageable pageable,
            List<RequestType> types,
            ApprovalRequestTab tab
    ) {
        final String jwt = jwtUtils.getJwtFromHeader(request);
        if (jwt == null) {
            throw new IllegalArgumentException("Missing JWT token in request header");
        }

        final String email = jwtUtils.getUsernameFromJwt(jwt);

        List<String> userEmails = List.of(email);

        Page<CalendarEntity> entities =
                repository.findFilteredRequests(types, userEmails, pageable, tab);

        Page<UserRequestResponseDto> mapped = entities.map(calendarMapper::mapToUserRequestResponseDto);

        return new PagedResponse<>(
                mapped.getContent(),
                mapped.getNumber(),
                mapped.getSize(),
                mapped.getTotalElements(),
                mapped.getTotalPages(),
                mapped.isLast()
        );
    }

    public OpenClosedRequestNumberResponse getOpenClosedRequestsNumber(){
        final List<String> allowedEmailsByRole = this.userService.getRoleBasedUsersEmail();
        return this.repository.getOpenClosedRequestsNumber(allowedEmailsByRole);
    }

    public List<CalendarResponseDto> saveCalendarEntities(HttpServletRequest request, List<SaveCalendarEntityRequestDto> calendarEntities) {
        List<CalendarEntity> newCalendarEntities = calendarMapper.fromCalendarSaveRequestToEntities(calendarEntities);
        final String userEmail = this.getUserEmailFromRequest(request);
        newCalendarEntities.forEach(calendarEntity -> {calendarEntity.setUserEmail(userEmail);});
        final List<CalendarEntity> savedCalendarEntities = this.repository.saveAll(newCalendarEntities);
        return calendarMapper.fromCalendarEntitiesToCalendarEntries(savedCalendarEntities);
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
        //System.out.println("check entries: "  + calendarEntries);
        return calendarMapper.fromCalendarsToCalendarEntries(calendarEntries);
    }

    private CalendarEntity getCalendarEntity(String entityId, String userEmail){
        System.out.println("ids: " + entityId );
        return repository
                .findByUserEmailAndId(userEmail, entityId)
                .orElseThrow(() -> new CalendarEntityNotFound(entityId));
    }

    public CalendarResponseDto deleteCalendarEntry(HttpServletRequest request , String entityId) {
        final String userEmail = this.getUserEmailFromRequest(request);
        CalendarEntity entity = getCalendarEntity(entityId, userEmail);
        repository.delete(entity);
        return calendarMapper.fromCalendarEntityToCalendarEntry(entity);
    }

    public List<CalendarResponseDto> deleteCalendarEntries(HttpServletRequest request, List<String> ids) {
        if(ids == null || ids.isEmpty()){
            throw new InvalidParameterException("ids is null or empty");
        }
        final String userEmail = this.getUserEmailFromRequest(request);
        List<CalendarEntity> entities = ids.stream().map(id -> this.getCalendarEntity(id, userEmail)).toList();
        repository.deleteAll(entities);
        return calendarMapper.fromCalendarEntitiesToCalendarEntries(entities);
    }

    private CalendarEntity updateCalendarEntityById(String id, CalendarEntity newEntity) {
        CalendarEntity existing = mongoTemplate.findById(id, CalendarEntity.class);

        if (existing == null) {
            throw new CalendarEntityNotFound(id);
        }

        checkWorkingTripAndRequestStatus(existing, newEntity);

        Update update = new Update();

        // aggiorna solo se non è null
        if (newEntity.getEntryType() != null) {
            update.set("entryType", newEntity.getEntryType());
        }

        // merge dei campi del sotto-documento calendarEntry
        if (newEntity.getCalendarEntry() != null) {
            mergeCalendarEntry(update, newEntity.getCalendarEntry());
        }

        Query query = new Query(Criteria.where("_id").is(id));

        CalendarEntity updated = mongoTemplate.findAndModify(
                query,
                update,
                FindAndModifyOptions.options().returnNew(true),
                CalendarEntity.class
        );

        if (updated == null) {
            throw new CalendarEntityNotFound(id);
        }

        return updated;
    }

    private void checkWorkingTripAndRequestStatus(CalendarEntity existing, CalendarEntity newEntity) {
        final CalendarEntry calendarEntry = existing.getCalendarEntry();
        RequestStatus status = null;

        if (calendarEntry instanceof CalendarRequestEntry requestEntry) {
            status = requestEntry.getStatus();
        } else if (calendarEntry instanceof CalendarWorkingTripEntry workingTripEntry) {
            status = workingTripEntry.getStatus();
        } else {
            // Nessuno status, niente validazioni
            return;
        }

        boolean isUser = this.userService.getCurrentUserRole().equals("USER");
        boolean isOwnerOfRequest = this.userService.getCurrentUserEmail().equals(newEntity.getUserEmail());

        if (status == RequestStatus.ACCEPTED || status == RequestStatus.REJECTED) {
            System.out.println("SONO QUI con una richiesta di tipo: " + status);
            throw new AccessDeniedException("Azione negata: " + "SONO QUI con una richiesta di tipo: " + status);
        }

        if (status == RequestStatus.PENDING && isUser && !isOwnerOfRequest) {
            System.out.println("SONO QUI");
            throw new AccessDeniedException("Azione negata " + "SONO QUI");
        }
    }

    private void mergeCalendarEntry(Update update, CalendarEntry newEntry) {
        if (newEntry instanceof CalendarRequestEntry req) {
            if (req.getRequestType() != null) update.set("calendarEntry.requestType", req.getRequestType());
            if (req.getDateFrom() != null) update.set("calendarEntry.dateFrom", req.getDateFrom());
            if (req.getDateTo() != null) update.set("calendarEntry.dateTo", req.getDateTo());
            if (req.getTimeFrom() != null) update.set("calendarEntry.timeFrom", req.getTimeFrom());
            if (req.getTimeTo() != null) update.set("calendarEntry.timeTo", req.getTimeTo());
            if (req.getStatus() != null) update.set("calendarEntry.status", req.getStatus());
        }

        if (newEntry instanceof CalendarWorkingTripEntry trip) {
            if (trip.getDateFrom() != null) update.set("calendarEntry.dateFrom", trip.getDateFrom());
            if (trip.getDateTo() != null) update.set("calendarEntry.dateTo", trip.getDateTo());
            if (trip.getStatus() != null) update.set("calendarEntry.status", trip.getStatus());
        }

        if (newEntry instanceof CalendarWorkingDayEntry day) {
            if (day.getProject() != null) update.set("calendarEntry.project", day.getProject());
            if (day.getHourFrom() != null) update.set("calendarEntry.hourFrom", day.getHourFrom());
            if (day.getHourTo() != null) update.set("calendarEntry.hourTo", day.getHourTo());
            if (day.getDateFrom() != null) update.set("calendarEntry.dateFrom", day.getDateFrom());
        }

        if (newEntry instanceof CalendarAvailabilityEntry av) {
            if (av.getProject() != null) update.set("calendarEntry.project", av.getProject());
            if (av.getDateFrom() != null) update.set("calendarEntry.dateFrom", av.getDateFrom());
            if (av.getDateTo() != null) update.set("calendarEntry.dateTo", av.getDateTo());
        }
    }

    public CalendarResponseDto updateCalendarEntity(HttpServletRequest request , String entityId, CalendarEntity updatedCalendarEntity) {
        final String userEmail = this.getUserEmailFromRequest(request);
        //CalendarEntity entity = getCalendarEntity(entityId, userEmail);
        final CalendarEntity newCalendarEntity = this.updateCalendarEntityById(entityId, updatedCalendarEntity);
        return calendarMapper.fromCalendarEntityToCalendarEntry(newCalendarEntity);
    }

    public List<CalendarResponseDto> updateCalendarEntities(HttpServletRequest request, List<CalendarEntity> calendarEntities) {
        final String userEmail = this.getUserEmailFromRequest(request);
        System.out.println("CHECK THIS: " + calendarEntities);
        List<CalendarEntity> updatedCalendarEntities = calendarEntities.stream().map(entity -> this.updateCalendarEntityById(entity.getId(), entity)).toList();
        return calendarMapper.fromCalendarEntitiesToCalendarEntries(updatedCalendarEntities);
    }

    public Boolean updateRequestStatus(String id, ApprovalAction action){
        final String userRole = this.userService.getCurrentUserRole();
        if(userRole.equalsIgnoreCase("ADMIN")){
            final String requestUserEmail = this.repository.findById(id).orElseThrow(() -> new NoUserFoundException("Richiesta non trovata")).getUserEmail();
            final String requestUserReole = this.userService.getUserProfileFromEmail(requestUserEmail).role().toString();
            if(requestUserReole.equalsIgnoreCase(userRole))
                throw new AccessDeniedException("Gli admin non possono gestire richieste proprie o di altri admin");
        }
        RequestStatus newStatus = (action == ApprovalAction.ACCEPT)
                ? RequestStatus.ACCEPTED
                : RequestStatus.REJECTED;
        return this.repository.updateRequestStatus(id, newStatus);
    }
}
