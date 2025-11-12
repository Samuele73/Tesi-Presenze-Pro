package com.tesi.presenzepro.calendar.repository;

import com.mongodb.client.result.UpdateResult;
import com.tesi.presenzepro.calendar.dto.ApprovalRequestTab;
import com.tesi.presenzepro.calendar.dto.OpenClosedRequestNumberResponse;
import com.tesi.presenzepro.calendar.model.CalendarEntity;
import com.tesi.presenzepro.calendar.model.CalendarEntryType;
import com.tesi.presenzepro.calendar.model.RequestStatus;
import com.tesi.presenzepro.calendar.model.RequestType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.regex.Pattern;

import static com.tesi.presenzepro.calendar.dto.ApprovalRequestTab.CLOSED;
import static com.tesi.presenzepro.calendar.dto.ApprovalRequestTab.OPEN;

@RequiredArgsConstructor
public class CalendarRepositoryCustomImpl implements CalendarRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public Page<CalendarEntity> findFilteredRequests(
            List<RequestType> requestTypes,
            List<String> userEmails,
            Pageable pageable,
            ApprovalRequestTab tab
    ) {
        Query query = new Query();

        // Includo solo REQUEST e WORKING_TRIP
        query.addCriteria(Criteria.where("entryType")
                .in(List.of(CalendarEntryType.REQUEST, CalendarEntryType.WORKING_TRIP)));

        // 🔹 Filtro per utenti (se forniti)
        if (userEmails != null && !userEmails.isEmpty()) {
            query.addCriteria(Criteria.where("userEmail").in(userEmails));
        }

        // 🔹 Filtro per tipi di richiesta (se forniti)
        if (requestTypes != null && !requestTypes.isEmpty()) {
            boolean includeTransfers = requestTypes.contains(RequestType.TRASFERTA);

            // Tipi diversi da TRASFERTA
            List<String> nonTransferTypes = requestTypes.stream()
                    .filter(t -> t != RequestType.TRASFERTA)
                    .map(Enum::name)
                    .toList();

            Criteria typeCriteria;

            if (includeTransfers && !nonTransferTypes.isEmpty()) {
                // Richieste + Trasferte
                typeCriteria = new Criteria().orOperator(
                        buildCaseInsensitiveTypeCriteria(nonTransferTypes),
                        buildTransferCriteria()
                );
            } else if (includeTransfers) {
                // Solo trasferte
                typeCriteria = buildTransferCriteria();
            } else {
                // Solo richieste (no trasferte)
                typeCriteria = buildCaseInsensitiveTypeCriteria(nonTransferTypes);
            }

            query.addCriteria(typeCriteria);
        }

        // 🔹 Filtro per tab (status)
        if (tab != null) {
            Criteria statusCriteria = switch (tab) {
                case OPEN -> Criteria.where("calendarEntry.status").is("PENDING");
                case CLOSED -> Criteria.where("calendarEntry.status").in(List.of("ACCEPTED", "REJECTED"));
            };
            query.addCriteria(statusCriteria);
        }

        // 🔹 Conta totale
        long total = mongoTemplate.count(query, CalendarEntity.class);

        // 🔹 Applica paginazione
        query.with(pageable);

        // 🔹 Risultati
        List<CalendarEntity> content = mongoTemplate.find(query, CalendarEntity.class);

        return new PageImpl<>(content, pageable, total);
    }


    private Criteria buildCaseInsensitiveTypeCriteria(List<String> requestTypeNames) {
        if (requestTypeNames == null || requestTypeNames.isEmpty()) {
            return new Criteria();
        }

        String pattern = "^(" + String.join("|", requestTypeNames) + ")$";
        return Criteria.where("calendarEntry.requestType")
                .regex(Pattern.compile(pattern, Pattern.CASE_INSENSITIVE));
    }

    private Criteria buildTransferCriteria() {
        return new Criteria().orOperator(
                Criteria.where("entryType").is(CalendarEntryType.WORKING_TRIP),
                Criteria.where("entryType").regex(Pattern.compile("working_trip", Pattern.CASE_INSENSITIVE))
        );
    }

    @Override
    public OpenClosedRequestNumberResponse getOpenClosedRequestsNumber(List<String> usersEmails) {
        // Costruzione criteri comuni (REQUEST + WORKING_TRIP)
        Criteria baseCriteria = Criteria.where("entryType")
                .in(List.of(CalendarEntryType.REQUEST, CalendarEntryType.WORKING_TRIP));

        // 🔹 Se viene passato un filtro per email, lo aggiungiamo
        if (usersEmails != null && !usersEmails.isEmpty()) {
            baseCriteria = new Criteria().andOperator(
                    baseCriteria,
                    Criteria.where("userEmail").in(usersEmails)
            );
        }

        // 🔹 Query per richieste APERTE (PENDING)
        Query openQuery = new Query(baseCriteria).addCriteria(
                Criteria.where("calendarEntry.status").is(RequestStatus.PENDING.name())
        );

        // 🔹 Query per richieste CHIUSE (ACCEPTED o REJECTED)
        Query closedQuery = new Query(baseCriteria).addCriteria(
                Criteria.where("calendarEntry.status").in(
                        List.of(RequestStatus.ACCEPTED.name(), RequestStatus.REJECTED.name())
                )
        );

        long openCount = mongoTemplate.count(openQuery, CalendarEntity.class);
        long closedCount = mongoTemplate.count(closedQuery, CalendarEntity.class);

        return new OpenClosedRequestNumberResponse(
                (int) openCount,
                (int) closedCount
        );
    }

    @Override
    public Boolean updateRequestStatus(String id, RequestStatus newStatus) {
        // Aggiorna solo REQUEST o WORKING_TRIP
        Query query = new Query(new Criteria().andOperator(
                Criteria.where("_id").is(id),
                Criteria.where("entryType").in(List.of(CalendarEntryType.REQUEST, CalendarEntryType.WORKING_TRIP))
        ));

        Update update = new Update().set("calendarEntry.status", newStatus);

        UpdateResult result = mongoTemplate.updateFirst(query, update, CalendarEntity.class);

        if (result.getMatchedCount() == 0) {
            throw new IllegalStateException("Nessuna richiesta trovata o tipo di entry non aggiornabile per ID: " + id);
        }
        return true;
    }

}
