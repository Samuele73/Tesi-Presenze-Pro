package com.tesi.presenzepro.calendar.service;

import com.tesi.presenzepro.calendar.model.*;
import com.tesi.presenzepro.calendar.repository.CalendarRepository;
import com.tesi.presenzepro.exception.NoDataFoundException;
import com.tesi.presenzepro.user.model.UserData;
import com.tesi.presenzepro.user.model.UserProfile;
import com.tesi.presenzepro.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.RegionUtil;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CalendarReportService {

    private final CalendarRepository calendarRepository;
    private final UserService userService;

    public XSSFWorkbook generateMonthlyReportFromCurrentYear(int month, int year) {
        String userEmail = this.userService.getCurrentUserEmail();

        // Recupero Dati dal DB
        List<CalendarEntity> yearmonthEntities = new ArrayList<>(this.calendarRepository.findUserYearMonthEntities(userEmail, year, month));

        // Se non ci sono dati, lancia eccezione (gestita dal controller advice -> 404)
        if (yearmonthEntities.isEmpty()) {
            throw new NoDataFoundException("Nessuna presenza trovata per il mese selezionato");
        }

        UserData userData = this.userService.getUserDataFromEmail(userEmail);
        UserProfile userProfile = this.userService.getUserProfileFromEmail(userEmail);

        String fullName = userProfile.name() + " " + userProfile.surname();

        // Correzione mese per YearMonth (Java Time usa 1-12)
        int calcMonth = month + 1;

        // Ore giornaliere (default 8 se null)
        int dailyHours = Optional.ofNullable(userData.dailyHours()).orElse(8);

        YearMonth ym = YearMonth.of(year, calcMonth);
        int daysInMonth = ym.lengthOfMonth();

        // ============================================================
        // 1. FASE DI CALCOLO
        // ============================================================
        double[] ordHours = new double[daysInMonth + 1];
        double[] extraHours = new double[daysInMonth + 1];
        String[] giustificativi = new String[daysInMonth + 1];
        Map<Integer, List<CalendarAvailabilityEntry>> availabilityByDay = new HashMap<>();

        // A) Working Trips (TRASFERTA)
        for (CalendarEntity entity : yearmonthEntities) {
            if (entity.getEntryType() != CalendarEntryType.WORKING_TRIP) continue;
            CalendarWorkingTripEntry trip = (CalendarWorkingTripEntry) entity.getCalendarEntry();

            // FILTRO STATUS: Solo ACCEPTED
            if (trip.getStatus() != RequestStatus.ACCEPTED) continue;

            LocalDate from = toLocalDate(trip.getDateFrom());
            LocalDate to = toLocalDate(trip.getDateTo());

            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                if (d.getYear() != year || d.getMonthValue() != calcMonth) continue;
                int day = d.getDayOfMonth();

                ordHours[day] = dailyHours; // Forza ore standard
                extraHours[day] = 0;        // Azzera straordinari
                giustificativi[day] = appendCode(giustificativi[day], "T");
            }
        }

        // B) Working Day (Task Giornaliere) - Non hanno status, vengono prese tutte
        for (CalendarEntity entity : yearmonthEntities) {
            if (entity.getEntryType() != CalendarEntryType.WORKING_DAY) continue;
            CalendarWorkingDayEntry wd = (CalendarWorkingDayEntry) entity.getCalendarEntry();
            LocalDate d = toLocalDate(wd.getDateFrom());
            if (d.getYear() != year || d.getMonthValue() != calcMonth) continue;

            int day = d.getDayOfMonth();

            // Se c'è già una Trasferta (T), le ore sono già al massimo
            if (containsCode(giustificativi[day], "T")) continue;

            double hours = diffHours(wd.getHourFrom(), wd.getHourTo());

            // Accumula ore se ci sono più entry nello stesso giorno
            double total = ordHours[day] + extraHours[day] + hours;

            if (total <= dailyHours) {
                ordHours[day] = total;
                extraHours[day] = 0;
            } else {
                ordHours[day] = dailyHours;
                extraHours[day] = total - dailyHours;
            }
        }

        // C) Requests (Ferie, Permessi, ecc.)
        for (CalendarEntity entity : yearmonthEntities) {
            if (entity.getEntryType() != CalendarEntryType.REQUEST) continue;
            CalendarRequestEntry req = (CalendarRequestEntry) entity.getCalendarEntry();

            // FILTRO STATUS: Solo ACCEPTED
            // Se status è null o diverso da ACCEPTED, salta l'iterazione
            if (req.getStatus() != RequestStatus.ACCEPTED) continue;

            LocalDate from = toLocalDate(req.getDateFrom());
            LocalDate to = toLocalDate(req.getDateTo());

            // Normalizza a uppercase per evitare problemi di case sensitive
            String type = (req.getRequestType() != null) ? req.getRequestType().toUpperCase() : "";

            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                if (d.getYear() != year || d.getMonthValue() != calcMonth) continue;
                int day = d.getDayOfMonth();

                String code = null;
                // Usiamo contains o equalsIgnoreCase per sicurezza
                if (type.contains("FERIE")) code = "FE";
                else if (type.contains("MALATTIA")) code = "MAL";
                else if (type.contains("CONGEDO")) code = "CO";
                else if (type.contains("PERMESSI") || type.contains("PERMESSO")) {
                    // Calcolo ore permesso: es. "4PE"
                    if (req.getTimeFrom() != null && req.getTimeTo() != null) {
                        double h = diffHours(req.getTimeFrom(), req.getTimeTo());
                        // Se intero (es 4.0) stampa 4, altrimenti 4.5
                        String hStr = (h % 1 == 0) ? String.valueOf((int) h) : String.valueOf(h);
                        code = hStr + "PE";
                    } else {
                        code = "PE";
                    }
                }

                if (code != null) {
                    giustificativi[day] = appendCode(giustificativi[day], code);
                }
            }
        }

        // D) Availability (Reperibilità)
        for (CalendarEntity entity : yearmonthEntities) {
            if (entity.getEntryType() != CalendarEntryType.AVAILABILITY) continue;
            CalendarAvailabilityEntry av = (CalendarAvailabilityEntry) entity.getCalendarEntry();
            LocalDate from = toLocalDate(av.getDateFrom());
            LocalDate to = toLocalDate(av.getDateTo());

            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                if (d.getYear() != year || d.getMonthValue() != calcMonth) continue;
                availabilityByDay.computeIfAbsent(d.getDayOfMonth(), k -> new ArrayList<>()).add(av);
            }
        }

        // ============================================================
        // 2. FASE DI RENDERING EXCEL
        // ============================================================

        XSSFWorkbook workbook = new XSSFWorkbook();
        XSSFSheet sheet = workbook.createSheet("Presenze " + year + "-" + String.format("%02d", calcMonth));

        // --- DEFINIZIONE STILI ---

        // Bordo completo + Centrato
        CellStyle borderCenter = workbook.createCellStyle();
        borderCenter.setBorderTop(BorderStyle.THIN);
        borderCenter.setBorderBottom(BorderStyle.THIN);
        borderCenter.setBorderLeft(BorderStyle.THIN);
        borderCenter.setBorderRight(BorderStyle.THIN);
        borderCenter.setAlignment(HorizontalAlignment.CENTER);
        borderCenter.setVerticalAlignment(VerticalAlignment.CENTER);

        // Bordo completo + Allineato a Sinistra
        CellStyle borderLeft = workbook.createCellStyle();
        borderLeft.cloneStyleFrom(borderCenter);
        borderLeft.setAlignment(HorizontalAlignment.LEFT);

        Font boldFont = workbook.createFont();
        boldFont.setBold(true);

        // Header Tabella generale
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.cloneStyleFrom(borderCenter);
        headerStyle.setFont(boldFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        // Titolo foglio
        CellStyle titleStyle = workbook.createCellStyle();
        titleStyle.setAlignment(HorizontalAlignment.LEFT);
        titleStyle.setFont(boldFont);

        // --- COSTRUZIONE GRIGLIA ---

        // RIGA 2: Titolo
        Row row2 = sheet.createRow(1);
        createCell(row2, 1, "PRESENZE MESE DI", titleStyle);
        createCell(row2, 2, year + "-" + String.format("%02d", calcMonth), titleStyle);

        //  INTESTAZIONI
        Row row4 = sheet.createRow(3);
        Row row5 = sheet.createRow(4);

        // Col A: Progr. (Merge A4:A5)
        createMergedCell(sheet, 3, 4, 0, 0, "Progr.", headerStyle);

        // Col B: "Dipendente" (B4) e "Cognome e nome" (B5) - Celle singole impilate
        createCell(row4, 1, "Dipendente", headerStyle);
        createCell(row5, 1, "Cognome e nome", headerStyle);

        // Col C: Vuote ma con stile header (per chiudere la griglia)
        createCell(row4, 2, "", headerStyle);
        createCell(row5, 2, "", headerStyle);

        // Col D: Giorni
        int firstDayCol = 3;
        for (int day = 1; day <= daysInMonth; day++) {
            int colIdx = firstDayCol + day - 1;
            LocalDate date = ym.atDay(day);

            // Iniziale Giorno
            createCell(row4, colIdx, dayOfWeekInitial(date.getDayOfWeek()), headerStyle);
            // Numero Giorno
            createCell(row5, colIdx, day, headerStyle);
        }

        // headers Reperibilità e Note
        int colAfterDays = firstDayCol + daysInMonth;
        int reperCol = colAfterDays;
        int noteCol = colAfterDays + 1;

        createMergedCell(sheet, 3, 4, reperCol, reperCol, "Reperibilità", headerStyle);
        createMergedCell(sheet, 3, 4, noteCol, noteCol, "Note", headerStyle);

        // DATI DIPENDENTE
        Row row6 = sheet.createRow(5);
        Row row7 = sheet.createRow(6);
        Row row8 = sheet.createRow(7);

        // Col A: "1" (Progr)
        createMergedCell(sheet, 5, 7, 0, 0, 1, borderCenter);

        // Col B: Nome Cognome
        createMergedCell(sheet, 5, 7, 1, 1, fullName, borderCenter);

        // Col C: Labels - Celle singole
        createCell(row6, 2, "Ore ord", borderCenter);
        createCell(row7, 2, "Ore str", borderCenter);
        createCell(row8, 2, "Giustif", borderCenter);

        // DATI GIORNALIERI
        for (int day = 1; day <= daysInMonth; day++) {
            int colIdx = firstDayCol + day - 1;
            LocalDate date = ym.atDay(day);
            boolean isWeekend = (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY);

            // 1. ORE ORDINARIE (Riga 6)
            Cell cOrd = row6.createCell(colIdx);
            cOrd.setCellStyle(borderCenter);

            if (ordHours[day] > 0) {
                // Se c'è un valore calcolato, lo scriviamo
                cOrd.setCellValue(ordHours[day]);
            } else if (!isWeekend) {
                // Se è feriale e non ci sono ore, scriviamo 0
                cOrd.setCellValue(0);
            }
            // Se è weekend e 0 ore, la cella resta vuota

            // 2. ORE STRAORDINARIE (Riga 7)
            Cell cStr = row7.createCell(colIdx);
            cStr.setCellStyle(borderCenter);
            if (extraHours[day] > 0) {
                cStr.setCellValue(extraHours[day]);
            } else if (!isWeekend) {
                cStr.setCellValue(0);
            }

            // 3. GIUSTIFICATIVI (Riga 8)
            Cell cGiu = row8.createCell(colIdx);
            cGiu.setCellStyle(borderCenter);
            if (giustificativi[day] != null) {
                cGiu.setCellValue(giustificativi[day]);
            }
        }

        String reperText = buildReperibilitaText(availabilityByDay);
        createMergedCell(sheet, 5, 7, reperCol, reperCol, reperText, borderCenter); // CENTRATO
        createMergedCell(sheet, 5, 7, noteCol, noteCol, "", borderCenter);

        int legRowIdx = 10; // Lascia riga 9 vuota
        Row legTitleRow = sheet.createRow(legRowIdx++);

        createCell(legTitleRow, 0, "LEGENDA GIUSTIFICATIVI", headerStyle);
        createCell(legTitleRow, 1, "", headerStyle); // Bordo cella adiacente

        createLegendRow(sheet, legRowIdx++, "FERIE", "FE", borderLeft);
        createLegendRow(sheet, legRowIdx++, "PERMESSI", "PE (es. 4PE = 4 ore)", borderLeft);
        createLegendRow(sheet, legRowIdx++, "MALATTIA", "MAL", borderLeft);
        createLegendRow(sheet, legRowIdx++, "CONGEDO", "CO", borderLeft);
        createLegendRow(sheet, legRowIdx++, "TRASFERTA", "T", borderLeft);

        // Adatta colonne
        for (int c = firstDayCol; c < colAfterDays; c++) {
            sheet.setColumnWidth(c, 4 * 256);
        }

        sheet.autoSizeColumn(0); // Per adattarsi a "LEGENDA GIUSTIFICATIVI"
        sheet.autoSizeColumn(1); // Nome dipendente / Descrizioni Legenda
        sheet.setColumnWidth(1, sheet.getColumnWidth(1) + (2 * 256));
        sheet.setColumnWidth(2, 10 * 256); // Labels fisse
        sheet.setColumnWidth(reperCol, 20 * 256);
        sheet.setColumnWidth(noteCol, 15 * 256);

        return workbook;
    }

    private void createCell(Row row, int colIndex, String value, CellStyle style) {
        Cell cell = row.createCell(colIndex);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void createCell(Row row, int colIndex, double value, CellStyle style) {
        Cell cell = row.createCell(colIndex);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void createLegendRow(XSSFSheet sheet, int rowIndex, String label, String code, CellStyle style) {
        Row row = sheet.createRow(rowIndex);

        Cell c0 = row.createCell(0);
        c0.setCellValue(label);
        c0.setCellStyle(style); // Applica bordo

        Cell c1 = row.createCell(1);
        c1.setCellValue(code);
        c1.setCellStyle(style); // Applica bordo
    }

    private void createMergedCell(XSSFSheet sheet, int firstRow, int lastRow, int firstCol, int lastCol, Object value, CellStyle style) {
        CellRangeAddress region = new CellRangeAddress(firstRow, lastRow, firstCol, lastCol);
        sheet.addMergedRegion(region);

        Row row = sheet.getRow(firstRow);
        if (row == null) row = sheet.createRow(firstRow);
        Cell cell = row.createCell(firstCol);
        cell.setCellStyle(style);

        if (value instanceof String) cell.setCellValue((String) value);
        else if (value instanceof Integer) cell.setCellValue((Integer) value);
        else if (value instanceof Double) cell.setCellValue((Double) value);

        // Applica bordi alla regione
        RegionUtil.setBorderTop(BorderStyle.THIN, region, sheet);
        RegionUtil.setBorderBottom(BorderStyle.THIN, region, sheet);
        RegionUtil.setBorderLeft(BorderStyle.THIN, region, sheet);
        RegionUtil.setBorderRight(BorderStyle.THIN, region, sheet);
    }

    private static LocalDate toLocalDate(Date date) {
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    }

    private static double diffHours(String from, String to) {
        if (from == null || to == null) return 0;
        // Gestione base eccezioni per formati errati
        try {
            LocalTime tFrom = LocalTime.parse(from);
            LocalTime tTo = LocalTime.parse(to);
            long mins = ChronoUnit.MINUTES.between(tFrom, tTo);
            return mins / 60.0;
        } catch (Exception e) {
            return 0;
        }
    }

    private static String appendCode(String existing, String code) {
        if (existing == null || existing.isBlank()) return code;
        if (existing.contains(code)) return existing; // Evita duplicati (es. T,T)
        return existing + "," + code;
    }

    private static boolean containsCode(String existing, String codeToCheck) {
        if (existing == null) return false;
        return existing.contains(codeToCheck);
    }

    private static String dayOfWeekInitial(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "L";
            case TUESDAY -> "M";
            case WEDNESDAY -> "M";
            case THURSDAY -> "G";
            case FRIDAY -> "V";
            case SATURDAY -> "S";
            case SUNDAY -> "D";
        };
    }

    private static String buildReperibilitaText(Map<Integer, List<CalendarAvailabilityEntry>> availabilityByDay) {
        if (availabilityByDay.isEmpty()) return "";
        List<Integer> days = new ArrayList<>(availabilityByDay.keySet());
        Collections.sort(days);

        StringBuilder sb = new StringBuilder("giorni ");
        int start = days.get(0);
        int prev = start;

        for (int i = 1; i < days.size(); i++) {
            int current = days.get(i);
            if (current == prev + 1) {
                prev = current;
            } else {
                appendRange(sb, start, prev);
                sb.append(", ");
                start = prev = current;
            }
        }
        appendRange(sb, start, prev);
        return sb.toString();
    }

    private static void appendRange(StringBuilder sb, int start, int end) {
        if (start == end) sb.append(start);
        else sb.append(start).append("-").append(end);
    }
}