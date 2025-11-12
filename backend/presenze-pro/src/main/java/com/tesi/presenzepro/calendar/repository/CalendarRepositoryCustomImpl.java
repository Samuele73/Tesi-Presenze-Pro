package com.tesi.presenzepro.calendar.repository;

import com.tesi.presenzepro.calendar.dto.ApprovalRequestTab;
import com.tesi.presenzepro.calendar.model.CalendarEntity;
import com.tesi.presenzepro.calendar.model.CalendarEntryType;
import com.tesi.presenzepro.calendar.model.RequestType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
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

}
