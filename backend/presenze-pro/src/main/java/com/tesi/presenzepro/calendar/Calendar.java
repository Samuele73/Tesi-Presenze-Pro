package com.tesi.presenzepro.calendar;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document
@JsonDeserialize(using = CalendarDeserializer.class)
public class Calendar {

    @Id
    private String id;
    private String user; //User Email associated with the calendar Entry
    private CalendarEntryType entryType; //Utilizzato dal CalendarDeserializer per convertire calendarEntry nella giusta implementazione quando avviene il JSon mapping
    private CalendarEntry calendarEntry;
}
