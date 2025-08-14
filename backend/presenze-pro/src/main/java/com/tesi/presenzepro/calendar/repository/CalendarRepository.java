package com.tesi.presenzepro.calendar.repository;

import com.tesi.presenzepro.calendar.model.Calendar;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

public interface CalendarRepository extends MongoRepository<Calendar, String> {
    List<Calendar> findAllByUserEmail(String userEmail);
}
