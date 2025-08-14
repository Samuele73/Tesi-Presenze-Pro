package com.tesi.presenzepro.calendar.repository;

import com.tesi.presenzepro.calendar.model.CalendarEntity;
import com.tesi.presenzepro.calendar.model.CalendarEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

public interface CalendarRepository extends MongoRepository<CalendarEntity, String> {
    List<CalendarEntity> findAllByUserEmail(String userEmail);

    @Query("{ 'userEmail': ?0, 'calendarEntry.from': { $gte: ?1, $lte: ?2 } }")
    List<CalendarEntity> findByUserAndFromBetween(String userEmail, Date start, Date end);
}
