package com.tesi.presenzepro.calendar.service;

import com.tesi.presenzepro.calendar.dto.*;
import com.tesi.presenzepro.calendar.exception.InsufficientHoursException;
import com.tesi.presenzepro.calendar.mapper.CalendarMapper;
import com.tesi.presenzepro.calendar.model.*;
import com.tesi.presenzepro.calendar.repository.CalendarRepository;
import com.tesi.presenzepro.exception.ConflictException;
import com.tesi.presenzepro.exception.NoDataFoundException;
import com.tesi.presenzepro.exception.NoUserFoundException;
import com.tesi.presenzepro.jwt.JwtUtils;
import com.tesi.presenzepro.notification.service.NotificationService;
import com.tesi.presenzepro.user.model.Role;
import com.tesi.presenzepro.user.model.UserData;
import com.tesi.presenzepro.user.model.UserProfile;
import com.tesi.presenzepro.user.service.UserService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.RegionUtil;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;

import java.security.InvalidParameterException;
import java.time.temporal.ChronoUnit;
import java.util.*;

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

        if(newCalendarEntity.getCalendarEntry() instanceof CalendarWorkingDayEntry workingDayEntry){
            if(this.isWeekend(workingDayEntry.getDateFrom()))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Non è possibile creare una giornata lavorativa nel weekend");
        }else if(newCalendarEntity.getCalendarEntry() instanceof  CalendarRequestEntry requestEntry){
            validateNotPast(requestEntry.getDateFrom(), requestEntry.getDateTo(), "Non si possono creare richieste con date precedenti ad oggi");
        }else if(newCalendarEntity.getCalendarEntry() instanceof  CalendarWorkingTripEntry workingTripEntry){
            validateNotPast(workingTripEntry.getDateFrom(), workingTripEntry.getDateTo(), "Non si possono creare trasferte con date precedenti ad oggi");
        }

        String userEmail = this.getUserEmailFromRequest(request);
        newCalendarEntity.setUserEmail(userEmail);
        this.applyDefaultStatus(newCalendarEntity);

        this.validateBusinessRulesForEntry(newCalendarEntity, null);

        // Controllo che siano disponibili le ore necessarie per le ferie o permessi
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


    private boolean isWeekend(Date date){
        return date.getDay() == 0 || date.getDay() == 6;
    }

    public boolean isBeforeToday(Date date) {
        // Converti la Date in LocalDate rispettando il fuso orario del server
        LocalDate inputDate = date.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();

        LocalDate today = LocalDate.now();

        return inputDate.isBefore(today);
    }

    private void validateNotPast(Date from, Date to, String errorMessage) {
        if (isBeforeToday(from) || isBeforeToday(to)) {
            throw new ConflictException(errorMessage);
        }
    }

    private void validateNotPast(Date from, Date to) {
        this.validateNotPast(from, to, "Non si possono creare voci con date precedenti a oggi");
    }

    private void sendRequestNotifs(String message){
        final String notifierUserEmail = this.userService.getCurrentUserEmail();
        List<String> usersEmail = new ArrayList<>(this.userService.findUsersEmailByRoles(List.of(Role.ADMIN, Role.OWNER)));
        usersEmail.remove(notifierUserEmail);
        System.out.println("GUARDA email NOTIFHCE: " +  usersEmail);
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

        // Prima applico i dati comuni
        newCalendarEntities.forEach(entity -> {
            entity.setUserEmail(userEmail);

            if (entity.getCalendarEntry() instanceof CalendarWorkingDayEntry workingDayEntry) {
                if (this.isWeekend(workingDayEntry.getDateFrom())) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Non è possibile creare una giornata lavorativa nel weekend");
                }
            }
        });

        // ========================================================
        //  VALIDAZIONE DB + VALIDAZIONE TRA LE ENTRY DELLO STESSO BATCH
        // ========================================================

        for (int i = 0; i < newCalendarEntities.size(); i++) {
            CalendarEntity current = newCalendarEntities.get(i);

            // 1️⃣ Validazione contro il DB
            this.validateBusinessRulesForEntry(current, null);

            // 2️⃣ Validazione contro le altre entry del batch (i+1 → fine)
            for (int j = i + 1; j < newCalendarEntities.size(); j++) {
                CalendarEntity other = newCalendarEntities.get(j);

                // Confronto solo se dello stesso tipo di problema
                this.validateBatchPair(current, other);
            }
        }

        // Tutto valido → salva
        final List<CalendarEntity> saved = this.repository.saveAll(newCalendarEntities);
        return calendarMapper.fromCalendarEntitiesToCalendarEntries(saved);
    }


    private void validateBatchPair(CalendarEntity a, CalendarEntity b) {

        CalendarEntryType typeA = a.getEntryType();
        CalendarEntryType typeB = b.getEntryType();

        CalendarEntry entryA = a.getCalendarEntry();
        CalendarEntry entryB = b.getCalendarEntry();

        // Caso 1: due WORKING_DAY nello stesso batch → controlli accavallamenti
        if (typeA == CalendarEntryType.WORKING_DAY && typeB == CalendarEntryType.WORKING_DAY) {
            CalendarWorkingDayEntry dayA = (CalendarWorkingDayEntry) entryA;
            CalendarWorkingDayEntry dayB = (CalendarWorkingDayEntry) entryB;

            LocalDate dateA = toLocalDate(dayA.getDateFrom());
            LocalDate dateB = toLocalDate(dayB.getDateFrom());

            if (dateA != null && dateA.equals(dateB)) {
                LocalTime aFrom = LocalTime.parse(dayA.getHourFrom());
                LocalTime aTo = LocalTime.parse(dayA.getHourTo());
                LocalTime bFrom = LocalTime.parse(dayB.getHourFrom());
                LocalTime bTo = LocalTime.parse(dayB.getHourTo());

                if (timesOverlap(aFrom, aTo, bFrom, bTo)) {
                    throw new ConflictException("Due giornate lavorative inserite insieme hanno orari sovrapposti: " + dateA);
                }
            }
        }

        // Caso 2: availability che si accavallano tra loro nel batch
        if (typeA == CalendarEntryType.AVAILABILITY && typeB == CalendarEntryType.AVAILABILITY) {
            CalendarAvailabilityEntry avA = (CalendarAvailabilityEntry) entryA;
            CalendarAvailabilityEntry avB = (CalendarAvailabilityEntry) entryB;

            LocalDate aFrom = toLocalDate(avA.getDateFrom());
            LocalDate aTo = toLocalDate(avA.getDateTo());
            LocalDate bFrom = toLocalDate(avB.getDateFrom());
            LocalDate bTo = toLocalDate(avB.getDateTo());

            if (rangesOverlap(aFrom, aTo, bFrom, bTo)) {
                throw new ConflictException("Due reperibilità inserite nello stesso batch sono sovrapposte");
            }
        }

        // Caso 3: TRIP e REQUEST con sovrapposizioni nel batch
        if (typeA == CalendarEntryType.REQUEST || typeA == CalendarEntryType.WORKING_TRIP ||
                typeB == CalendarEntryType.REQUEST || typeB == CalendarEntryType.WORKING_TRIP) {

            LocalDate aFrom = null, aTo = null, bFrom = null, bTo = null;

            if (entryA instanceof CalendarRequestEntry rA) {
                aFrom = toLocalDate(rA.getDateFrom());
                aTo = toLocalDate(rA.getDateTo());
            } else if (entryA instanceof CalendarWorkingTripEntry tA) {
                aFrom = toLocalDate(tA.getDateFrom());
                aTo = toLocalDate(tA.getDateTo());
            }

            if (entryB instanceof CalendarRequestEntry rB) {
                bFrom = toLocalDate(rB.getDateFrom());
                bTo = toLocalDate(rB.getDateTo());
            } else if (entryB instanceof CalendarWorkingTripEntry tB) {
                bFrom = toLocalDate(tB.getDateFrom());
                bTo = toLocalDate(tB.getDateTo());
            }

            if (aFrom != null && aTo != null && bFrom != null && bTo != null) {
                if (rangesOverlap(aFrom, aTo, bFrom, bTo)) {
                    throw new ConflictException("Due richieste/trasferte inserite insieme hanno intervalli sovrapposti");
                }
            }
        }
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
                .orElseThrow(() -> new NoDataFoundException(entityId));
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
        System.out.println("HO FATTO UPDATE DI: " + id + " " + newEntity.toString());
        checkWorkingTripAndRequestStatus(existing, newEntity);
        triggerUserHoursUpdate(existing, newEntity);
        return this.repository.updateCalendarEntityById(id, newEntity);
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
        calendarEntities.forEach(calendarEntity -> {
            final String approvalRequestType = this.getApprovalRequestType(calendarEntity);
            final String notifMessage = "L'utente " + userEmail + " ha aggiornato una sua richiesta di " + approvalRequestType;
            this.sendRequestNotifs(notifMessage);
        });
        return calendarMapper.fromCalendarEntitiesToCalendarEntries(updatedCalendarEntities);
    }

    public Boolean updateRequestStatus(String id, ApprovalAction action){
        final String userRole = this.userService.getCurrentUserRole();
        final CalendarEntity request = this.repository.findById(id).orElseThrow(() -> new NoUserFoundException("Richiesta non trovata"));
        if(userRole.equalsIgnoreCase("ADMIN")){
            final String requestUserEmail = request.getUserEmail();
            final String requestUserRole = this.userService.getFullUserProfileResponseDtoFromEmail(requestUserEmail).role().toString();
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

    public UserRequestResponseDto getUserRequest(String id){
        CalendarEntity entity = repository.findById(id).orElseThrow(() -> new NoUserFoundException("Richiesta non trovata"));
        return this.calendarMapper.mapToUserRequestResponseDto(entity);
    }

    //VALIDAZIONE BUSINESS LOGIC ENTRIES CALENDARIO

    private LocalDate toLocalDate(Date date) {
        if (date == null) return null;
        return date.toInstant()
                .atZone(ZoneOffset.UTC)
                .toLocalDate();
    }

    private boolean rangesOverlap(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2) {
        return !start1.isAfter(end2) && !start2.isAfter(end1);
    }

    private boolean timesOverlap(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }

    private double calculateWorkingDayHours(CalendarWorkingDayEntry day) {
        if (day.getHourFrom() == null || day.getHourTo() == null) {
            throw new ConflictException("Gli orari di inizio e fine sono obbligatori per una giornata lavorativa");
        }
        LocalTime from = LocalTime.parse(day.getHourFrom());
        LocalTime to = LocalTime.parse(day.getHourTo());

        if (!to.isAfter(from)) {
            throw new ConflictException("L'orario di fine deve essere successivo all'orario di inizio");
        }

        long minutes = Duration.between(from, to).toMinutes();
        if (minutes <= 0) {
            throw new ConflictException("La durata della giornata lavorativa deve essere positiva");
        }
        return minutes / 60.0;
    }

    private double getUserDailyHours(String userEmail) {
        System.out.println("USER DAILY HOURS REQ: " + this.userService.getUserDataFromEmail(userEmail));
        return this.userService.getUserDataFromEmail(userEmail).dailyHours();
    }

    private void validateBusinessRulesForEntry(CalendarEntity entity, String excludeId) {
        String userEmail = this.userService.getCurrentUserEmail();
        System.out.println("CHEKC user email: " +  userEmail);
        if (userEmail == null) {
            throw new IllegalStateException("UserEmail non impostata sull'entry del calendario");
        }

        CalendarEntry entry = entity.getCalendarEntry();
        CalendarEntryType type = entity.getEntryType();

        if (type == CalendarEntryType.WORKING_DAY && entry instanceof CalendarWorkingDayEntry workingDayEntry) {
            validateWorkingDayEntry(workingDayEntry, userEmail, excludeId);
        } else if (type == CalendarEntryType.REQUEST && entry instanceof CalendarRequestEntry requestEntry) {
            validateRequestOrTripEntry(requestEntry.getDateFrom(), requestEntry.getDateTo(), userEmail, excludeId);
        } else if (type == CalendarEntryType.WORKING_TRIP && entry instanceof CalendarWorkingTripEntry tripEntry) {
            validateRequestOrTripEntry(tripEntry.getDateFrom(), tripEntry.getDateTo(), userEmail, excludeId);
        } else if (type == CalendarEntryType.AVAILABILITY && entry instanceof CalendarAvailabilityEntry availabilityEntry) {
            validateAvailabilityEntry(availabilityEntry, userEmail, excludeId);
        }
    }

    /**
     * Regola: se inserisco/modifico una REQUEST o WORKING_TRIP,
     * nel range [dateFrom, dateTo] non devono esistere:
     *  - richieste (REQUEST) PENDING/ACCEPTED
     *  - trasferte (WORKING_TRIP) PENDING/ACCEPTED
     *  - giornate lavorative (WORKING_DAY) in quei giorni
     */
    private void validateRequestOrTripEntry(Date from, Date to, String userEmail, String excludeId) {
        if (from == null || to == null) {
            throw new ConflictException("Le date di inizio e fine sono obbligatorie");
        }

        LocalDate newFrom = toLocalDate(from);
        LocalDate newTo = toLocalDate(to);

        if (newTo.isBefore(newFrom)) {
            throw new ConflictException("La data di fine non può essere precedente a quella di inizio");
        }

        List<CalendarEntity> userEntries = repository.findAllByUserEmail(userEmail);

        for (CalendarEntity existing : userEntries) {
            if (excludeId != null && excludeId.equals(existing.getId())) continue;

            CalendarEntryType type = existing.getEntryType();
            CalendarEntry ce = existing.getCalendarEntry();

            if (type == CalendarEntryType.REQUEST && ce instanceof CalendarRequestEntry req) {
                RequestStatus status = req.getStatus();
                if (status != RequestStatus.PENDING && status != RequestStatus.ACCEPTED) continue;

                LocalDate exFrom = toLocalDate(req.getDateFrom());
                LocalDate exTo = toLocalDate(req.getDateTo());
                if (exFrom == null || exTo == null) continue;

                if (rangesOverlap(newFrom, newTo, exFrom, exTo)) {
                    throw new ConflictException("L'intervallo selezionato si sovrappone ad una richiesta già presente.");
                }
            } else if (type == CalendarEntryType.WORKING_TRIP && ce instanceof CalendarWorkingTripEntry trip) {
                RequestStatus status = trip.getStatus();
                if (status != RequestStatus.PENDING && status != RequestStatus.ACCEPTED) continue;

                LocalDate exFrom = toLocalDate(trip.getDateFrom());
                LocalDate exTo = toLocalDate(trip.getDateTo());
                if (exFrom == null || exTo == null) continue;

                if (rangesOverlap(newFrom, newTo, exFrom, exTo)) {
                    throw new ConflictException("L'intervallo selezionato si sovrappone ad una trasferta già presente.");
                }
            } else if (type == CalendarEntryType.WORKING_DAY && ce instanceof CalendarWorkingDayEntry day) {
                LocalDate exDate = toLocalDate(day.getDateFrom());
                if (exDate != null && !exDate.isBefore(newFrom) && !exDate.isAfter(newTo)) {
                    throw new ConflictException("L'intervallo selezionato include una giornata lavorativa già presente.");
                }
            }
        }
    }

    /**
     * Regole per WORKING_DAY:
     * - hourFrom/hourTo obbligatori
     * - project obbligatorio
     * - niente weekend (già gestito altrove, ma lo ricontrolliamo per sicurezza)
     * - non può sovrapporsi ad altre working day nello stesso giorno
     * - non può cadere in un giorno coperto da FERIE/CONGEDO (full day, PENDING/ACCEPTED)
     * - non può sovrapporsi negli orari a PERMESSI/MALATTIA (PENDING/ACCEPTED)
     * - le ore lavorate del giorno non possono superare dailyHours - orePermessi
     * - non può cadere in un giorno coperto da una trasferta (TRIP) PENDING/ACCEPTED
     */
    private void validateWorkingDayEntry(CalendarWorkingDayEntry newDay, String userEmail, String excludeId) {
        System.out.println("new day: " + newDay);
        // VALIDAZIONI BASE
        if (newDay.getHourFrom() == null || newDay.getHourTo() == null) {
            throw new ConflictException("Gli orari di inizio e fine sono obbligatori per una giornata lavorativa");
        }
        if (newDay.getProject() == null || newDay.getProject().isBlank()) {
            throw new ConflictException("Il progetto è obbligatorio per una giornata lavorativa");
        }
        if (newDay.getDateFrom() == null) {
            throw new ConflictException("La data è obbligatoria per una giornata lavorativa");
        }
        if (this.isWeekend(newDay.getDateFrom())) {
            throw new ConflictException("Non è possibile creare una giornata lavorativa nel weekend");
        }

        LocalDate date = toLocalDate(newDay.getDateFrom());
        LocalTime newFrom = LocalTime.parse(newDay.getHourFrom());
        LocalTime newTo = LocalTime.parse(newDay.getHourTo());

        if (!newTo.isAfter(newFrom)) {
            throw new ConflictException("L'orario di fine deve essere successivo all'orario di inizio");
        }

        List<CalendarEntity> entries = repository.findAllByUserEmail(userEmail);

        double existingWorkingHours = 0.0;
        double totalPermitHours = 0.0;

        for (CalendarEntity e : entries) {
            if (excludeId != null && excludeId.equals(e.getId())) continue;

            CalendarEntryType type = e.getEntryType();
            CalendarEntry ce = e.getCalendarEntry();

            // GIORNATE LAVORATIVE ESISTENTI
            if (type == CalendarEntryType.WORKING_DAY && ce instanceof CalendarWorkingDayEntry day) {
                LocalDate d = toLocalDate(day.getDateFrom());
                if (d != null && d.equals(date)) {
                    LocalTime exFrom = LocalTime.parse(day.getHourFrom());
                    LocalTime exTo = LocalTime.parse(day.getHourTo());

                    if (timesOverlap(newFrom, newTo, exFrom, exTo)) {
                        throw new ConflictException("Esiste già una giornata lavorativa con orari sovrapposti in questa data");
                    }

                    existingWorkingHours += calculateWorkingDayHours(day);
                }
            }

            // RICHIESTE
            else if (type == CalendarEntryType.REQUEST && ce instanceof CalendarRequestEntry req) {
                RequestStatus status = req.getStatus();
                if (status != RequestStatus.PENDING && status != RequestStatus.ACCEPTED) continue;

                LocalDate fromDate = toLocalDate(req.getDateFrom());
                LocalDate toDate = toLocalDate(req.getDateTo());
                if (fromDate == null || toDate == null) continue;

                boolean dateIncluded = !date.isBefore(fromDate) && !date.isAfter(toDate);
                if (!dateIncluded) continue;

                String rt = req.getRequestType() != null ? req.getRequestType().trim().toUpperCase() : "";

                // FERIE / CONGEDO → full day
                if ("FERIE".equals(rt) || "CONGEDO".equals(rt)) {
                    System.out.println("IL BUGP: " + req);
                    throw new ConflictException("Non puoi inserire una giornata lavorativa in un giorno coperto da una richiesta di " + rt);
                }

                // PERMESSI / MALATTIA → orario + multi-day
                if ("PERMESSI".equals(rt) || "MALATTIA".equals(rt)) {

                    LocalTime reqFrom = req.getTimeFrom() != null ? LocalTime.parse(req.getTimeFrom()) : null;
                    LocalTime reqTo   = req.getTimeTo()   != null ? LocalTime.parse(req.getTimeTo())   : null;

                    // Caso A → permesso senza orario → FULL DAY
                    if (reqFrom == null || reqTo == null) {
                        throw new ConflictException("Questa richiesta di " + rt + " copre l'intera giornata. Non puoi lavorare.");
                    }

                    // Caso B → permesso single-day (classico)
                    if (fromDate.equals(toDate) && fromDate.equals(date)) {

                        if (timesOverlap(newFrom, newTo, reqFrom, reqTo)) {
                            throw new ConflictException("Gli orari della giornata lavorativa si sovrappongono ad una richiesta di " + rt);
                        }

                        long permMinutes = Duration.between(reqFrom, reqTo).toMinutes();
                        if (permMinutes > 0 && "PERMESSI".equals(rt)) {
                            totalPermitHours += permMinutes / 60.0;
                        }
                        continue;
                    }

                    // Caso C → MULTI-DAY

                    // Primo giorno
                    if (date.equals(fromDate)) {
                        if (timesOverlap(newFrom, newTo, reqFrom, LocalTime.MAX)) {
                            throw new ConflictException("Gli orari della giornata lavorativa si sovrappongono al primo giorno della richiesta di " + rt);
                        }

                        long permMinutes = Duration.between(reqFrom, LocalTime.MAX).toMinutes();
                        if ("PERMESSI".equals(rt)) totalPermitHours += permMinutes / 60.0;
                        continue;
                    }

                    // Ultimo giorno
                    if (date.equals(toDate)) {
                        if (timesOverlap(newFrom, newTo, LocalTime.MIN, reqTo)) {
                            throw new ConflictException("Gli orari della giornata lavorativa si sovrappongono all'ultimo giorno della richiesta di " + rt);
                        }

                        long permMinutes = Duration.between(LocalTime.MIN, reqTo).toMinutes();
                        if ("PERMESSI".equals(rt)) totalPermitHours += permMinutes / 60.0;
                        continue;
                    }

                    // Giorni intermedi → applica gli stessi orari del permesso
                    if (date.isAfter(fromDate) && date.isBefore(toDate)) {

                        // Se sovrappone gli orari → errore
                        if (timesOverlap(newFrom, newTo, reqFrom, reqTo)) {
                            throw new ConflictException("Gli orari della giornata lavorativa si sovrappongono ad una richiesta di " + rt);
                        }

                        // Somma ore permesso (solo per PERMESSI)
                        if ("PERMESSI".equals(rt)) {
                            long permMinutes = Duration.between(reqFrom, reqTo).toMinutes();
                            if (permMinutes > 0) totalPermitHours += permMinutes / 60.0;
                        }
                    }
                }
            }

            // TRASFERTE
            else if (type == CalendarEntryType.WORKING_TRIP && ce instanceof CalendarWorkingTripEntry trip) {
                RequestStatus status = trip.getStatus();
                if (status != RequestStatus.PENDING && status != RequestStatus.ACCEPTED) continue;

                LocalDate tripFrom = toLocalDate(trip.getDateFrom());
                LocalDate tripTo = toLocalDate(trip.getDateTo());

                if (tripFrom != null && tripTo != null &&
                        !date.isBefore(tripFrom) && !date.isAfter(tripTo)) {
                    throw new ConflictException("Non puoi inserire una giornata lavorativa in un giorno coperto da una trasferta");
                }
            }
        }

        // LIMITE ORE GIORNALIERE
        double newWorkingHours = calculateWorkingDayHours(newDay);
        double dailyHours = getUserDailyHours(userEmail);

        double maxWorkable = dailyHours - totalPermitHours;
        if (maxWorkable < 0) {
            maxWorkable = 0;
        }

        if (existingWorkingHours + newWorkingHours > maxWorkable) {
            throw new ConflictException(
                    "Le ore lavorative totali del giorno (" +
                            (existingWorkingHours + newWorkingHours) +
                            ") superano il limite consentito considerando i permessi (" +
                            maxWorkable + ")."
            );
        }
    }


    /**
     * Regola: una AVAILABILITY (reperibilità) non può sovrapporsi ad un'altra AVAILABILITY
     */
    private void validateAvailabilityEntry(CalendarAvailabilityEntry newAv, String userEmail, String excludeId) {
        if (newAv.getDateFrom() == null || newAv.getDateTo() == null) {
            throw new ConflictException("Le date di inizio e fine sono obbligatorie per la reperibilità");
        }

        LocalDate newFrom = toLocalDate(newAv.getDateFrom());
        LocalDate newTo = toLocalDate(newAv.getDateTo());

        if (newTo.isBefore(newFrom)) {
            throw new ConflictException("La data di fine non può essere precedente a quella di inizio per la reperibilità");
        }

        List<CalendarEntity> entries = repository.findAllByUserEmail(userEmail);

        for (CalendarEntity e : entries) {
            if (excludeId != null && excludeId.equals(e.getId())) continue;

            if (e.getEntryType() != CalendarEntryType.AVAILABILITY) continue;
            CalendarEntry ce = e.getCalendarEntry();
            if (!(ce instanceof CalendarAvailabilityEntry av)) continue;

            LocalDate exFrom = toLocalDate(av.getDateFrom());
            LocalDate exTo = toLocalDate(av.getDateTo());
            if (exFrom == null || exTo == null) continue;

            if (rangesOverlap(newFrom, newTo, exFrom, exTo)) {
                throw new ConflictException("L'intervallo di reperibilità si sovrappone ad un'altra reperibilità esistente");
            }
        }
    }


}
