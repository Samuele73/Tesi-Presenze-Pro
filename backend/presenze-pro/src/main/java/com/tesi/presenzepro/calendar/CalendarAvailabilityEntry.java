package com.tesi.presenzepro.calendar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CalendarAvailabilityEntry implements CalendarEntry{
    private Date from;
    private Date to;
    private String project;
}
