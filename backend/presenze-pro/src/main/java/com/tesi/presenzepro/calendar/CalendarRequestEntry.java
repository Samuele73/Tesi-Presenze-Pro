package com.tesi.presenzepro.calendar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CalendarRequestEntry implements CalendarEntry{
    private String request_type;
    private Date date_from;
    private Date date_to;
    private String time_from;
    private String time_to;
}
