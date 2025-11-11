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

        query.addCriteria(Criteria.where("entryType")
                .in(List.of(CalendarEntryType.REQUEST, CalendarEntryType.WORKING_TRIP)));

        if (userEmails != null && !userEmails.isEmpty()) {
            query.addCriteria(Criteria.where("userEmail").in(userEmails));
        }

        if (requestTypes != null && !requestTypes.isEmpty()) {
            // Qui serve un OR perché "requestType" esiste solo in REQUEST
            // e "TRASFERTA" è rappresentato da entryType WORKING_TRIP.
            Criteria typeCriteria = new Criteria().orOperator(
                    Criteria.where("calendarEntry.requestType").in(
                            requestTypes.stream()
                                    .map(RequestType::name)
                                    .toList()
                    ),
                    new Criteria().andOperator(
                            Criteria.where("entryType").is(CalendarEntryType.WORKING_TRIP),
                            Criteria.where("calendarEntry").exists(true),
                            Criteria.where("calendarEntry").ne(null),
                            Criteria.where("calendarEntry").not().size(0),
                            Criteria.where("calendarEntry.dateFrom").exists(true)
                    )
            );
            query.addCriteria(typeCriteria);
        }

        long total = mongoTemplate.count(query, CalendarEntity.class);

        query.with(pageable);

        List<CalendarEntity> content = mongoTemplate.find(query, CalendarEntity.class);

        return new PageImpl<>(content, pageable, total);
    }
}
