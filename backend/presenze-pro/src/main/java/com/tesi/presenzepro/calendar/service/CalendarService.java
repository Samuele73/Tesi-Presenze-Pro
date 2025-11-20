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
import com.tesi.presenzepro.user.model.UserData;
import com.tesi.presenzepro.user.model.UserProfile;
import com.tesi.presenzepro.user.service.UserService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.RegionUtil;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
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

    public XSSFWorkbook generateMonthlyReportFromCurrentYear(int month) {
        int currentYear = Year.now().getValue();
        String userEmail = this.userService.getCurrentUserEmail();

        // Recupero Dati dal DB
        List<CalendarEntity> yearmonthEntities = new ArrayList<>(this.repository.findUserYearMonthEntities(userEmail, currentYear, month));
        UserData userData = this.userService.getUserDataFromEmail(userEmail);
        UserProfile userProfile = this.userService.getUserProfileFromEmail(userEmail);

        String fullName = userProfile.name() + " " + userProfile.surname();

        // Correzione mese per YearMonth (Java Time usa 1-12)
        int calcMonth = month + 1;

        // Ore giornaliere (default 8 se null)
        int dailyHours = Optional.ofNullable(userData.dailyHours()).orElse(8);

        YearMonth ym = YearMonth.of(currentYear, calcMonth);
        int daysInMonth = ym.lengthOfMonth();

        // 1. FASE DI CALCOLO
        double[] ordHours = new double[daysInMonth + 1];
        double[] extraHours = new double[daysInMonth + 1];
        String[] giustificativi = new String[daysInMonth + 1];
        Map<Integer, List<CalendarAvailabilityEntry>> availabilityByDay = new HashMap<>();

        // A) Working Trips (TRASFERTA)
        for (CalendarEntity entity : yearmonthEntities) {
            if (entity.getEntryType() != CalendarEntryType.WORKING_TRIP) continue;
            CalendarWorkingTripEntry trip = (CalendarWorkingTripEntry) entity.getCalendarEntry();
            if (trip.getStatus() != RequestStatus.ACCEPTED) continue;

            LocalDate from = toLocalDate(trip.getDateFrom());
            LocalDate to = toLocalDate(trip.getDateTo());

            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                if (d.getYear() != currentYear || d.getMonthValue() != calcMonth) continue;
                int day = d.getDayOfMonth();

                ordHours[day] = dailyHours; // Forza ore standard
                extraHours[day] = 0;        // Azzera straordinari pre-esistenti (se logica lo richiede)
                giustificativi[day] = appendCode(giustificativi[day], "T");
            }
        }

        // B) Working Day (Task Giornaliere)
        for (CalendarEntity entity : yearmonthEntities) {
            if (entity.getEntryType() != CalendarEntryType.WORKING_DAY) continue;
            CalendarWorkingDayEntry wd = (CalendarWorkingDayEntry) entity.getCalendarEntry();
            LocalDate d = toLocalDate(wd.getDateFrom());
            if (d.getYear() != currentYear || d.getMonthValue() != calcMonth) continue;

            int day = d.getDayOfMonth();

            // Se c'è già una Trasferta (T), le ore sono già al massimo
            if (containsCode(giustificativi[day], "T")) continue;

            double hours = diffHours(wd.getHourFrom(), wd.getHourTo());

            // Accumula ore se ci sono più entry nello stesso giorno
            double total = ordHours[day] + extraHours[day] + hours;

            if (total <= dailyHours) {
                ordHours[day] = total;
                extraHours[day] = 0;
            } else {
                ordHours[day] = dailyHours;
                extraHours[day] = total - dailyHours;
            }
        }

        // C) Requests (Ferie, Permessi, ecc.)
        for (CalendarEntity entity : yearmonthEntities) {
            if (entity.getEntryType() != CalendarEntryType.REQUEST) continue;
            CalendarRequestEntry req = (CalendarRequestEntry) entity.getCalendarEntry();

            // Controllo Status (se necessario, es. solo ACCEPTED)
            // if (req.getStatus() != RequestStatus.ACCEPTED) continue;

            LocalDate from = toLocalDate(req.getDateFrom());
            LocalDate to = toLocalDate(req.getDateTo());
            // Normalizza a uppercase per evitare problemi di case sensitive
            String type = (req.getRequestType() != null) ? req.getRequestType().toUpperCase() : "";

            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                if (d.getYear() != currentYear || d.getMonthValue() != calcMonth) continue;
                int day = d.getDayOfMonth();

                String code = null;
                // Usiamo contains o equalsIgnoreCase per sicurezza
                if (type.contains("FERIE")) code = "FE";
                else if (type.contains("MALATTIA")) code = "MAL";
                else if (type.contains("CONGEDO")) code = "CO";
                else if (type.contains("PERMESSI") || type.contains("PERMESSO")) {
                    // Calcolo ore permesso: es. "4PE"
                    if (req.getTimeFrom() != null && req.getTimeTo() != null) {
                        double h = diffHours(req.getTimeFrom(), req.getTimeTo());
                        // Se intero (es 4.0) stampa 4, altrimenti 4.5
                        String hStr = (h % 1 == 0) ? String.valueOf((int) h) : String.valueOf(h);
                        code = hStr + "PE";
                    } else {
                        code = "PE";
                    }
                }

                if (code != null) {
                    giustificativi[day] = appendCode(giustificativi[day], code);
                }
            }
        }

        // D) Availability (Reperibilità)
        for (CalendarEntity entity : yearmonthEntities) {
            if (entity.getEntryType() != CalendarEntryType.AVAILABILITY) continue;
            CalendarAvailabilityEntry av = (CalendarAvailabilityEntry) entity.getCalendarEntry();
            LocalDate from = toLocalDate(av.getDateFrom());
            LocalDate to = toLocalDate(av.getDateTo());

            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                if (d.getYear() != currentYear || d.getMonthValue() != calcMonth) continue;
                availabilityByDay.computeIfAbsent(d.getDayOfMonth(), k -> new ArrayList<>()).add(av);
            }
        }

        // 2. FASE DI RENDERING EXCEL

        XSSFWorkbook workbook = new XSSFWorkbook();
        XSSFSheet sheet = workbook.createSheet("Presenze " + currentYear + "-" + String.format("%02d", calcMonth));

        // --- DEFINIZIONE STILI ---

        // Bordo completo + Centrato
        CellStyle borderCenter = workbook.createCellStyle();
        borderCenter.setBorderTop(BorderStyle.THIN);
        borderCenter.setBorderBottom(BorderStyle.THIN);
        borderCenter.setBorderLeft(BorderStyle.THIN);
        borderCenter.setBorderRight(BorderStyle.THIN);
        borderCenter.setAlignment(HorizontalAlignment.CENTER);
        borderCenter.setVerticalAlignment(VerticalAlignment.CENTER);

        // Bordo completo + Allineato a Sinistra
        CellStyle borderLeft = workbook.createCellStyle();
        borderLeft.cloneStyleFrom(borderCenter);
        borderLeft.setAlignment(HorizontalAlignment.LEFT);

        Font boldFont = workbook.createFont();
        boldFont.setBold(true);

        // Header Tabella generale
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.cloneStyleFrom(borderCenter);
        headerStyle.setFont(boldFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        // Titolo foglio
        CellStyle titleStyle = workbook.createCellStyle();
        titleStyle.setAlignment(HorizontalAlignment.LEFT);
        titleStyle.setFont(boldFont);

        // --- COSTRUZIONE GRIGLIA ---

        // RIGA 2: Titolo
        Row row2 = sheet.createRow(1);
        createCell(row2, 1, "PRESENZE MESE DI", titleStyle);
        createCell(row2, 2, currentYear + "-" + String.format("%02d", calcMonth), titleStyle);

        //  INTESTAZIONI
        Row row4 = sheet.createRow(3);
        Row row5 = sheet.createRow(4);

        // Col A: Progr. (Merge A4:A5)
        createMergedCell(sheet, 3, 4, 0, 0, "Progr.", headerStyle);

        // Col B: "Dipendente" (B4) e "Cognome e nome" (B5) - Celle singole impilate
        createCell(row4, 1, "Dipendente", headerStyle);
        createCell(row5, 1, "Cognome e nome", headerStyle);

        // Col C: Vuote ma con stile header (per chiudere la griglia)
        createCell(row4, 2, "", headerStyle);
        createCell(row5, 2, "", headerStyle);

        // Col D: Giorni
        int firstDayCol = 3;
        for (int day = 1; day <= daysInMonth; day++) {
            int colIdx = firstDayCol + day - 1;
            LocalDate date = ym.atDay(day);

            // Iniziale Giorno
            createCell(row4, colIdx, dayOfWeekInitial(date.getDayOfWeek()), headerStyle);
            // Numero Giorno
            createCell(row5, colIdx, day, headerStyle);
        }

        // headers Reperibilità e Note
        int colAfterDays = firstDayCol + daysInMonth;
        int reperCol = colAfterDays;
        int noteCol = colAfterDays + 1;

        createMergedCell(sheet, 3, 4, reperCol, reperCol, "Reperibilità", headerStyle);
        createMergedCell(sheet, 3, 4, noteCol, noteCol, "Note", headerStyle);

        // DATI DIPENDENTE
        Row row6 = sheet.createRow(5);
        Row row7 = sheet.createRow(6);
        Row row8 = sheet.createRow(7);

        // Col A: "1" (Progr)
        createMergedCell(sheet, 5, 7, 0, 0, 1, borderCenter);

        // Col B: Nome Cognome
        createMergedCell(sheet, 5, 7, 1, 1, fullName, borderCenter);

        // Col C: Labels - Celle singole
        createCell(row6, 2, "Ore ord", borderCenter);
        createCell(row7, 2, "Ore str", borderCenter);
        createCell(row8, 2, "Giustif", borderCenter);

        // DATI GIORNALIERR
        for (int day = 1; day <= daysInMonth; day++) {
            int colIdx = firstDayCol + day - 1;
            LocalDate date = ym.atDay(day);
            boolean isWeekend = (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY);

            // 1. ORE ORDINARIE (Riga 6)
            Cell cOrd = row6.createCell(colIdx);
            cOrd.setCellStyle(borderCenter);

            if (ordHours[day] > 0) {
                // Se c'è un valore calcolato, lo scriviamo
                cOrd.setCellValue(ordHours[day]);
            } else if (!isWeekend) {
                // Se è feriale e non ci sono ore, scriviamo 0
                cOrd.setCellValue(0);
            }
            // Se è weekend e 0 ore, la cella resta vuota

            // 2. ORE STRAORDINARIE (Riga 7)
            Cell cStr = row7.createCell(colIdx);
            cStr.setCellStyle(borderCenter);
            if (extraHours[day] > 0) {
                cStr.setCellValue(extraHours[day]);
            } else if (!isWeekend) {
                cStr.setCellValue(0);
            }

            // 3. GIUSTIFICATIVI (Riga 8)
            Cell cGiu = row8.createCell(colIdx);
            cGiu.setCellStyle(borderCenter);
            if (giustificativi[day] != null) {
                cGiu.setCellValue(giustificativi[day]);
            }
        }

        String reperText = buildReperibilitaText(availabilityByDay);
        createMergedCell(sheet, 5, 7, reperCol, reperCol, reperText, borderCenter); // CENTRATO
        createMergedCell(sheet, 5, 7, noteCol, noteCol, "", borderCenter);

        int legRowIdx = 10; // Lascia riga 9 vuota
        Row legTitleRow = sheet.createRow(legRowIdx++);

        createCell(legTitleRow, 0, "LEGENDA GIUSTIFICATIVI", headerStyle);
        createCell(legTitleRow, 1, "", headerStyle); // Bordo cella adiacente

        createLegendRow(sheet, legRowIdx++, "FERIE", "FE", borderLeft);
        createLegendRow(sheet, legRowIdx++, "PERMESSI", "PE (es. 4PE = 4 ore)", borderLeft);
        createLegendRow(sheet, legRowIdx++, "MALATTIA", "MAL", borderLeft);
        createLegendRow(sheet, legRowIdx++, "CONGEDO", "CO", borderLeft);
        createLegendRow(sheet, legRowIdx++, "TRASFERTA", "T", borderLeft);

        // Adatta colonne
        for (int c = firstDayCol; c < colAfterDays; c++) {
            sheet.setColumnWidth(c, 4 * 256);
        }

        sheet.autoSizeColumn(0); // Per adattarsi a "LEGENDA GIUSTIFICATIVI"
        sheet.autoSizeColumn(1); // Nome dipendente / Descrizioni Legenda
        sheet.setColumnWidth(1, sheet.getColumnWidth(1) + (2 * 256));
        sheet.setColumnWidth(2, 10 * 256); // Labels fisse
        sheet.setColumnWidth(reperCol, 20 * 256);
        sheet.setColumnWidth(noteCol, 15 * 256);

        return workbook;
    }

    private void createCell(Row row, int colIndex, String value, CellStyle style) {
        Cell cell = row.createCell(colIndex);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void createCell(Row row, int colIndex, double value, CellStyle style) {
        Cell cell = row.createCell(colIndex);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void createLegendRow(XSSFSheet sheet, int rowIndex, String label, String code, CellStyle style) {
        Row row = sheet.createRow(rowIndex);

        Cell c0 = row.createCell(0);
        c0.setCellValue(label);
        c0.setCellStyle(style); // Applica bordo

        Cell c1 = row.createCell(1);
        c1.setCellValue(code);
        c1.setCellStyle(style); // Applica bordo
    }

    private void createMergedCell(XSSFSheet sheet, int firstRow, int lastRow, int firstCol, int lastCol, Object value, CellStyle style) {
        CellRangeAddress region = new CellRangeAddress(firstRow, lastRow, firstCol, lastCol);
        sheet.addMergedRegion(region);

        Row row = sheet.getRow(firstRow);
        if (row == null) row = sheet.createRow(firstRow);
        Cell cell = row.createCell(firstCol);
        cell.setCellStyle(style);

        if (value instanceof String) cell.setCellValue((String) value);
        else if (value instanceof Integer) cell.setCellValue((Integer) value);
        else if (value instanceof Double) cell.setCellValue((Double) value);

        // Applica bordi alla regione
        RegionUtil.setBorderTop(BorderStyle.THIN, region, sheet);
        RegionUtil.setBorderBottom(BorderStyle.THIN, region, sheet);
        RegionUtil.setBorderLeft(BorderStyle.THIN, region, sheet);
        RegionUtil.setBorderRight(BorderStyle.THIN, region, sheet);
    }

    private static LocalDate toLocalDate(Date date) {
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    }

    private static double diffHours(String from, String to) {
        if (from == null || to == null) return 0;
        // Gestione base eccezioni per formati errati
        try {
            LocalTime tFrom = LocalTime.parse(from);
            LocalTime tTo = LocalTime.parse(to);
            long mins = ChronoUnit.MINUTES.between(tFrom, tTo);
            return mins / 60.0;
        } catch (Exception e) {
            return 0;
        }
    }

    private static String appendCode(String existing, String code) {
        if (existing == null || existing.isBlank()) return code;
        if (existing.contains(code)) return existing; // Evita duplicati (es. T,T)
        return existing + "," + code;
    }

    private static boolean containsCode(String existing, String codeToCheck) {
        if (existing == null) return false;
        return existing.contains(codeToCheck);
    }

    private static String dayOfWeekInitial(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "L";
            case TUESDAY -> "M";
            case WEDNESDAY -> "M";
            case THURSDAY -> "G";
            case FRIDAY -> "V";
            case SATURDAY -> "S";
            case SUNDAY -> "D";
        };
    }

    private static String buildReperibilitaText(Map<Integer, List<CalendarAvailabilityEntry>> availabilityByDay) {
        if (availabilityByDay.isEmpty()) return "";
        List<Integer> days = new ArrayList<>(availabilityByDay.keySet());
        Collections.sort(days);

        StringBuilder sb = new StringBuilder("giorni ");
        int start = days.get(0);
        int prev = start;

        for (int i = 1; i < days.size(); i++) {
            int current = days.get(i);
            if (current == prev + 1) {
                prev = current;
            } else {
                appendRange(sb, start, prev);
                sb.append(", ");
                start = prev = current;
            }
        }
        appendRange(sb, start, prev);
        return sb.toString();
    }

    private static void appendRange(StringBuilder sb, int start, int end) {
        if (start == end) sb.append(start);
        else sb.append(start).append("-").append(end);
    }

}
