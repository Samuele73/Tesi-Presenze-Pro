package com.tesi.presenzepro.calendar.repository;

import com.tesi.presenzepro.calendar.model.CalendarEntity;
import com.tesi.presenzepro.calendar.model.CalendarEntry;
import com.tesi.presenzepro.calendar.model.CalendarEntryType;
import com.tesi.presenzepro.calendar.model.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface CalendarRepository extends MongoRepository<CalendarEntity, String>, CalendarRepositoryCustom {
    List<CalendarEntity> findAllByUserEmail(String userEmail);

    @Query("{ 'userEmail': ?0, 'calendarEntry.dateFrom': { $gte: ?1, $lte: ?2 } }")
    List<CalendarEntity> findByUserEmailAndDateFromBetween(String userEmail, Date start, Date end);

    Optional<CalendarEntity> findByUserEmailAndId(String userEmail, String id);

    Optional<CalendarEntity> findById(String id);

    Page<CalendarEntity> findByUserEmailAndEntryTypeIn(
            String userEmail,
            List<CalendarEntryType> entryTypes,
            Pageable pageable
    );

    Page<CalendarEntity> findByEntryTypeIn(
            List<CalendarEntryType> entryTypes,
            Pageable pageable
    );
}
