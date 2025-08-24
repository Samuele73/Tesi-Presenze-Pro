package com.tesi.presenzepro.calendar;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tesi.presenzepro.calendar.dto.SaveCalendarEntityRequestDto;
import com.tesi.presenzepro.calendar.model.*;
import com.tesi.presenzepro.exception.WrongCalendarEntityTypeException;

import java.io.IOException;

// Cambia da CalendarDeserializer a BaseCalendarEntityDeserializer
public class BaseCalendarEntityDeserializer extends JsonDeserializer<BaseCalendarEntity> {

    @Override
    public BaseCalendarEntity deserialize(JsonParser jp, DeserializationContext ctxt) throws IOException {
        JsonNode node = jp.getCodec().readTree(jp);

        String entryType = node.get("entryType").asText();
        JsonNode calendarEntryNode = node.get("calendarEntry");

        ObjectMapper mapper = (ObjectMapper) jp.getCodec();
        CalendarEntry calendarEntry = deserializeCalendarEntry(mapper, calendarEntryNode, entryType);

        // QUESTA È LA PARTE NUOVA: determina quale sottoclasse istanziare
        if (node.has("userEmail")) {
            // È un CalendarEntity completo
            CalendarEntity calendarEntity = new CalendarEntity();
            calendarEntity.setUserEmail(node.get("userEmail").asText());
            calendarEntity.setEntryType(CalendarEntryType.valueOf(entryType));
            calendarEntity.setCalendarEntry(calendarEntry);
            calendarEntity.setId(node.get("id").asText());
            return calendarEntity;
        } else {
            // È un SaveCalendarEntityRequestDto
            SaveCalendarEntityRequestDto dto = new SaveCalendarEntityRequestDto();
            dto.setEntryType(CalendarEntryType.valueOf(entryType));
            dto.setCalendarEntry(calendarEntry);
            return dto;
        }
    }

    private CalendarEntry deserializeCalendarEntry(ObjectMapper mapper, JsonNode calendarEntryNode, String entryType) throws IOException {
        if ("WORKING_TRIP".equals(entryType)) {
            return mapper.treeToValue(calendarEntryNode, CalendarWorkingTripEntry.class);
        } else if ("WORKING_DAY".equals(entryType)) {
            return mapper.treeToValue(calendarEntryNode, CalendarWorkingDayEntry.class);
        } else if ("REQUEST".equals(entryType)) {
            return mapper.treeToValue(calendarEntryNode, CalendarRequestEntry.class);
        } else if ("AVAILABILITY".equals(entryType)) {
            return mapper.treeToValue(calendarEntryNode, CalendarAvailabilityEntry.class);
        } else {
            throw new WrongCalendarEntityTypeException("Wrong entry type: " + entryType);
        }
    }
}



