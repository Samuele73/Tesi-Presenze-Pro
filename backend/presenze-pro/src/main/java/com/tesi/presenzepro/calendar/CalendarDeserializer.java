package com.tesi.presenzepro.calendar;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tesi.presenzepro.calendar.model.*;
import com.tesi.presenzepro.exception.WrongCalendarEntryTypeException;

import java.io.IOException;

public class CalendarDeserializer extends JsonDeserializer<CalendarEntity> {

    @Override
    public CalendarEntity deserialize(JsonParser jp, DeserializationContext ctxt) throws IOException {
        JsonNode node = jp.getCodec().readTree(jp);

        // Estrai il campo entryType
        String entryType = node.get("entryType").asText();

        // Ottieni il nodo calendarEntry
        JsonNode calendarEntryNode = node.get("calendarEntry");

        ObjectMapper mapper = (ObjectMapper) jp.getCodec();
        CalendarEntry calendarEntry;

        // Deserializza il nodo calendarEntry basandosi su entryType
        if ("WORKING_TRIP".equals(entryType)) {
            calendarEntry = mapper.treeToValue(calendarEntryNode, CalendarWorkingTripEntry.class);
        }else if("WORKING_DAY".equals(entryType)){
            calendarEntry = mapper.treeToValue(calendarEntryNode, CalendarWorkingDayEntry.class);
        }else if("REQUEST".equals(entryType)){
            calendarEntry = mapper.treeToValue(calendarEntryNode, CalendarRequestEntry.class);
        }else if("AVAILABILITY".equals(entryType)){
            calendarEntry = mapper.treeToValue(calendarEntryNode, CalendarAvailabilityEntry.class);
        }else {
            throw new WrongCalendarEntryTypeException("Wrong entry type: " + entryType);
        }

        // Crea l'istanza di Calendar e popola i campi
        CalendarEntity calendarEntity = new CalendarEntity();
        calendarEntity.setUserEmail(node.get("userEmail").asText());
        calendarEntity.setEntryType(CalendarEntryType.valueOf(entryType));
        calendarEntity.setCalendarEntry(calendarEntry);

        return calendarEntity;
    }
}

