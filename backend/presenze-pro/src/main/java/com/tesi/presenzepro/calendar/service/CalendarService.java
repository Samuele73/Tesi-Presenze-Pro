package com.tesi.presenzepro.calendar.service;

import com.tesi.presenzepro.calendar.dto.*;
import com.tesi.presenzepro.calendar.exception.InsufficientHoursException;
import com.tesi.presenzepro.calendar.mapper.CalendarMapper;
import com.tesi.presenzepro.calendar.model.*;
import com.tesi.presenzepro.calendar.repository.CalendarRepository;
import com.tesi.presenzepro.exception.CalendarEntityNotFoundException;
import com.tesi.presenzepro.exception.NoUserFoundException;
import com.tesi.presenzepro.jwt.JwtUtils;
import com.tesi.presenzepro.notification.service.NotificationService;
import com.tesi.presenzepro.user.model.Role;
import com.tesi.presenzepro.user.service.UserService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.*;

import java.security.InvalidParameterException;
import java.util.ArrayList;
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
    private final NotificationService notifService;

    public CalendarResponseDto saveNewCalendarEntry(HttpServletRequest request ,SaveCalendarEntityRequestDto calendarEntityData){
        CalendarEntity newCalendarEntity = calendarMapper.fromCalendarSaveRequestToEntity(calendarEntityData);
        String userEmail = this.getUserEmailFromRequest(request);
        newCalendarEntity.setUserEmail(userEmail);
        this.applyDefaultStatus(newCalendarEntity);

        //Controllo che siano disponibili le ore necessarie per le ferie o permessi
        if(newCalendarEntity.getCalendarEntry() instanceof CalendarRequestEntry requestEntry){
            final String requestType = requestEntry.getRequestType();
            if(requestType.equalsIgnoreCase("PERMESSI") || requestType.equalsIgnoreCase("FERIE")){
                boolean isPermit = requestType.equalsIgnoreCase("PERMESSI");
                Double hours = isPermit ? this.calculateHours(requestEntry, false) : this.calculateHours(requestEntry, true);
                boolean isNotForbidden = isPermit ? this.userService.modifyPermitHours(-hours, request) : this.userService.modifyLeaveHours(-hours, request);
                if(!isNotForbidden){
                    throw new InsufficientHoursException("Non hai le ore necessarie per questa richiesta");
                }
            }
        }

        CalendarEntity calendarEntity =  this.repository.save(newCalendarEntity);

        try {
            String approvalReqeustType = this.getApprovalRequestType(calendarEntity);
            String notifMessage = "L'utente " + userEmail + " ha creato una richiesta di " + approvalReqeustType;
            this.sendRequestNotifs(notifMessage);
        }catch (Exception e){
            e.printStackTrace();
        }


        return calendarMapper.fromCalendarEntityToCalendarEntry(calendarEntity);
    }

    private void sendRequestNotifs(String message){
        final String notifierUserEmail = this.userService.getCurrentUserEmail();
        List<String> usersEmail = new ArrayList<>(this.userService.findUsersEmailByRoles(List.of(Role.ADMIN, Role.OWNER)));
        usersEmail.remove(notifierUserEmail);
        usersEmail.forEach(email -> {
            this.notifService.send(email, message);
        });
    }

    public Double calculateHours(CalendarRequestEntry request, boolean isLeave) {

        // Caso FERIE: 24 ore per giorno
        if (isLeave) {
            LocalDate fromDate = request.getDateFrom().toInstant()
                    .atZone(ZoneOffset.UTC).toLocalDate();

            LocalDate toDate = request.getDateTo().toInstant()
                    .atZone(ZoneOffset.UTC).toLocalDate();

            long days = Duration.between(fromDate.atStartOfDay(), toDate.plusDays(1).atStartOfDay()).toDays();

            return days * 24.0;
        }

        // Caso PERMESSI o Richieste normali: usa orari
        LocalDate fromDate = request.getDateFrom().toInstant()
                .atZone(ZoneOffset.UTC).toLocalDate();

        LocalDate toDate = request.getDateTo().toInstant()
                .atZone(ZoneOffset.UTC).toLocalDate();

        LocalTime fromTime = LocalTime.parse(request.getTimeFrom());
        LocalTime toTime = LocalTime.parse(request.getTimeTo());

        LocalDateTime start = LocalDateTime.of(fromDate, fromTime);
        LocalDateTime end = LocalDateTime.of(toDate, toTime);

        long minutes = Duration.between(start, end).toMinutes();

        return minutes / 60.0;
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
                .orElseThrow(() -> new CalendarEntityNotFoundException(entityId));
    }

    public CalendarResponseDto deleteCalendarEntry(HttpServletRequest request , String entityId) {
        final String userEmail = this.getUserEmailFromRequest(request);
        CalendarEntity entity = getCalendarEntity(entityId, userEmail);
        checkWorkingTripAndRequestStatus(entity, entity);
        recoverUserHoursFromCalendarEntity(entity, userEmail);
        repository.delete(entity);

        String approvalRequestType = this.getApprovalRequestType(entity);
        final String notifMessage = "L'utente " + userEmail + " ha eliminato una richiesta di " + approvalRequestType;
        this.sendRequestNotifs(notifMessage);

        return calendarMapper.fromCalendarEntityToCalendarEntry(entity);
    }

    private String getApprovalRequestType(CalendarEntity entity){
        String approvalRequestType = "Error";
        if(entity.getCalendarEntry() instanceof CalendarRequestEntry requestEntry){
            approvalRequestType = requestEntry.getRequestType();
        }else if(entity.getCalendarEntry() instanceof  CalendarWorkingTripEntry workingTripEntry){
            approvalRequestType = "TRASFERTA";
        }
        return approvalRequestType;
    }

    private void recoverUserHoursFromCalendarEntity(CalendarEntity entity, String userEmail){
        CalendarEntry calendarEntry = entity.getCalendarEntry();
        if(calendarEntry instanceof CalendarRequestEntry requestEntry){
            //in questo caso limite sono state recuperate quando è stata declinata
            if(requestEntry.getStatus().equals(RequestStatus.REJECTED))
                return;
            boolean isLeave = requestEntry.getRequestType().equalsIgnoreCase("FERIE");
            Double recoverHours = this.calculateHours(requestEntry, isLeave);
            HoursType type = isLeave ? HoursType.LEAVE : HoursType.PERMIT;
            System.out.println("User hours: " + recoverHours);
            this.userService.modifyUserHours(recoverHours, type, userEmail);
        }
    }

    public boolean deleteCalendarEntries(HttpServletRequest request, List<String> ids) {
        if(ids == null || ids.isEmpty()){
            throw new InvalidParameterException("ids is null or empty");
        }
        ids.forEach(id -> {deleteCalendarEntry(request, id);});
        return true;
    }

    private CalendarEntity updateCalendarEntityById(String id, CalendarEntity newEntity) {
        CalendarEntity existing = mongoTemplate.findById(id, CalendarEntity.class);

        if (existing == null) {
            throw new CalendarEntityNotFoundException(id);
        }

        checkWorkingTripAndRequestStatus(existing, newEntity);
        triggerUserHoursUpdate(existing, newEntity);

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
            throw new CalendarEntityNotFoundException(id);
        }

        return updated;
    }

    private void triggerUserHoursUpdate(CalendarEntity existing, CalendarEntity newEntity) {
        //checkWorkingTripAndRequestStatus(existing, newEntity);

        CalendarEntry oldEntry = existing.getCalendarEntry();
        CalendarEntry newEntry = newEntity.getCalendarEntry();
        if (oldEntry instanceof CalendarRequestEntry oldReq &&
                newEntry instanceof CalendarRequestEntry newReq) {

            boolean isLeave = oldReq.getRequestType().equalsIgnoreCase("FERIE");

            double oldHours = calculateHours(oldReq, isLeave);
            double newHours = calculateHours(newReq, isLeave);

            double delta = oldHours - newHours;

            if (delta != 0) {
                HoursType type = isLeave ? HoursType.LEAVE : HoursType.PERMIT;

                boolean updated = userService.modifyUserHours(
                        delta,
                        type,
                        existing.getUserEmail()
                );

                if (!updated) {
                    throw new InsufficientHoursException("Saldo ore negativo");
                }
            }
        }
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
        boolean isOwnerOfRequest = this.userService.getCurrentUserEmail().equals(existing.getUserEmail());
        System.out.println("isowner of request: " + isOwnerOfRequest);
        System.out.println(this.userService.getCurrentUserEmail() + " - " + existing.getUserEmail());

        if (status == RequestStatus.ACCEPTED || status == RequestStatus.REJECTED) {
            System.out.println("SONO QUI con una richiesta di tipo: " + status);
            throw new AccessDeniedException("Non è possibile manipolare richieste non più in sospeso");
        }

        if (status == RequestStatus.PENDING && isUser && !isOwnerOfRequest) {
            System.out.println("SONO QUI");
            throw new AccessDeniedException("Azione non consentita");
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
        final String approvalRequestType = this.getApprovalRequestType(newCalendarEntity);
        final String notifMessage = "L'utente " + userEmail + " ha aggiornato una sua richiesta di " + approvalRequestType;
        this.sendRequestNotifs(notifMessage);
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
        final CalendarEntity request = this.repository.findById(id).orElseThrow(() -> new NoUserFoundException("Richiesta non trovata"));
        if(userRole.equalsIgnoreCase("ADMIN")){
            final String requestUserEmail = request.getUserEmail();
            final String requestUserRole = this.userService.getUserProfileFromEmail(requestUserEmail).role().toString();
            if(requestUserRole.equalsIgnoreCase(userRole))
                throw new AccessDeniedException("Gli admin non possono gestire richieste proprie o di altri admin");
        }
        RequestStatus newStatus = (action == ApprovalAction.ACCEPT)
                ? RequestStatus.ACCEPTED
                : RequestStatus.REJECTED;
        final boolean updateResult = this.repository.updateRequestStatus(id, newStatus);
        // Recupera le ore di permessi o ferie nel caso in cui la richiesta non venga accettata
        if(action == ApprovalAction.REJECT){
            this.recoverUserHoursFromCalendarEntity(request, request.getUserEmail());
        }
        this.sendNotifsForRequestStatusChange(action, request);
        return updateResult;
    }

    private void sendNotifsForRequestStatusChange(ApprovalAction action, CalendarEntity request){
        final String approvalRequestType = this.getApprovalRequestType(request);
        final String actionString = action.equals(ApprovalAction.ACCEPT) ? "accettata" : "rifiutata";
        final String requestUserEmail = request.getUserEmail();
        final String notifMessage = "Una richiesta di " + approvalRequestType + "è stata " + actionString + " per l'utente " + requestUserEmail;
        final String notifierUserEmail = this.userService.getCurrentUserEmail();
        List<String> usersEmail = new ArrayList<>(this.userService.findUsersEmailByRoles(List.of(Role.ADMIN, Role.OWNER)));
        usersEmail.remove(notifierUserEmail);
        usersEmail.remove(requestUserEmail);
        usersEmail.forEach(email -> {
            this.notifService.send(email, notifMessage);
        });
        final String toUserNotifMessage = "Una tua richiesta di " + approvalRequestType + " è stata " + actionString;
        this.notifService.send(requestUserEmail, toUserNotifMessage);
    }
}
