package com.tesi.presenzepro.calendar.repository;

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

@RequiredArgsConstructor
public class CalendarRepositoryCustomImpl implements CalendarRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public Page<CalendarEntity> findFilteredRequests(
            List<RequestType> requestTypes,
            List<String> userEmails,
            Pageable pageable
    ) {
        Query query = new Query();

        // Includi solo REQUEST e WORKING_TRIP
        query.addCriteria(Criteria.where("entryType")
                .in(List.of(CalendarEntryType.REQUEST, CalendarEntryType.WORKING_TRIP)));

        // Filtro per utenti (se fornito)
        if (userEmails != null && !userEmails.isEmpty()) {
            query.addCriteria(Criteria.where("userEmail").in(userEmails));
        }

        // Filtro per tipo richiesta (se fornito)
        if (requestTypes != null && !requestTypes.isEmpty()) {
            boolean includeTransfers = requestTypes.contains(RequestType.TRASFERTA);

            // Lista tipi diversi da TRASFERTA
            List<String> nonTransferTypes = requestTypes.stream()
                    .filter(t -> t != RequestType.TRASFERTA)
                    .map(Enum::name)
                    .toList();

            Criteria typeCriteria;

            if (includeTransfers && !nonTransferTypes.isEmpty()) {
                // includi sia TRASFERTA che altri tipi
                typeCriteria = new Criteria().orOperator(
                        Criteria.where("calendarEntry.requestType").in(nonTransferTypes),
                        Criteria.where("entryType").is(CalendarEntryType.WORKING_TRIP)
                );
            } else if (includeTransfers) {
                // solo trasferte
                typeCriteria = Criteria.where("entryType").is(CalendarEntryType.WORKING_TRIP);
            } else {
                // solo richieste non-trasferta
                typeCriteria = Criteria.where("calendarEntry.requestType").in(nonTransferTypes);
            }

            query.addCriteria(typeCriteria);
        }

        long total = mongoTemplate.count(query, CalendarEntity.class);
        query.with(pageable);

        List<CalendarEntity> content = mongoTemplate.find(query, CalendarEntity.class);

        return new PageImpl<>(content, pageable, total);
    }
}
