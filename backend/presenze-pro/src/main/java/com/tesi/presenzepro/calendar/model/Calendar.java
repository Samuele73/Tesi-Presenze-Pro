package com.tesi.presenzepro.calendar.model;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.tesi.presenzepro.calendar.CalendarDeserializer;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document
@JsonDeserialize(using = CalendarDeserializer.class)
@Schema(description = "Rappresenta una entry del calendario nella sua interezza, cioè quella che viene visualizzata nel DB")
public class Calendar {

    @Id
    private String id;
    @Indexed
    private String userEmail; //User Email associated with the calendar Entry
    private CalendarEntryType entryType; //Utilizzato dal CalendarDeserializer per convertire calendarEntry nella giusta implementazione quando avviene il JSon mapping
    private CalendarEntry calendarEntry;
}
