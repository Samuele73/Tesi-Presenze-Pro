package com.tesi.presenzepro.calendar;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Rappresenta una entry riguardante una task giornaliera nel calendario")
public class CalendarWorkingDayEntry implements CalendarEntry{
    private String project;
    private String hour_from;
    private String hour_to;
    private Date date_from;
}
