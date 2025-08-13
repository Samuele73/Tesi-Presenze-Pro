package com.tesi.presenzepro.calendar;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.w3c.dom.stylesheets.LinkStyle;

import java.util.List;
import java.util.Optional;

public interface CalendarRepository extends MongoRepository<Calendar, String> {
    List<Calendar> findAllByUserId(String userEmail);
}
