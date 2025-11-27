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
        List<CalendarEntity> yearmonthEntities = new ArrayList<>(this.calendarRepository.findUserYearMonthEntities(userEmail, year, month));
        if (yearmonthEntities.isEmpty()) {
            throw new NoDataFoundException("Nessuna presenza trovata per il mese selezionato");
        }

        UserData userData = this.userService.getUserDataFromEmail(userEmail);
        UserProfile userProfile = this.userService.getUserProfileFromEmail(userEmail);

        String fullName = userProfile.name() + " " + userProfile.surname();

        int calcMonth = month + 1;
        int dailyHours = Optional.ofNullable(userData.dailyHours()).orElse(8);

        YearMonth ym = YearMonth.of(year, calcMonth);
        int daysInMonth = ym.lengthOfMonth();

        // 1. FASE DI CALCOLO
        double[] ordHours = new double[daysInMonth + 1];
        double[] extraHours = new double[daysInMonth + 1];
        String[] giustificativi = new String[daysInMonth + 1];
        Map<String, Set<Integer>> availabilityByProject = new HashMap<>();

        // A) TRASFERTA (Vince su tutto)
        for (CalendarEntity entity : yearmonthEntities) {
            if (entity.getEntryType() != CalendarEntryType.WORKING_TRIP) continue;
            CalendarWorkingTripEntry trip = (CalendarWorkingTripEntry) entity.getCalendarEntry();

            if (trip.getStatus() != RequestStatus.ACCEPTED) continue;

            LocalDate from = toLocalDate(trip.getDateFrom());
            LocalDate to = toLocalDate(trip.getDateTo());

            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                if (d.getYear() != year || d.getMonthValue() != calcMonth) continue;
                int day = d.getDayOfMonth();

                ordHours[day] = dailyHours;
                extraHours[day] = 0;
                giustificativi[day] = appendCode(giustificativi[day], "T");
            }
        }

        // B) WORKING DAY
        Map<Integer, Double> rawHoursPerDay = new HashMap<>();

        for (CalendarEntity entity : yearmonthEntities) {
            if (entity.getEntryType() != CalendarEntryType.WORKING_DAY) continue;
            CalendarWorkingDayEntry wd = (CalendarWorkingDayEntry) entity.getCalendarEntry();
            LocalDate d = toLocalDate(wd.getDateFrom());
            if (d.getYear() != year || d.getMonthValue() != calcMonth) continue;

            int day = d.getDayOfMonth();
            // Se c'è già una Trasferta (T), ignoriamo le ore lavorate (la trasferta copre la giornata)
            if (containsCode(giustificativi[day], "T")) continue;

            double hours = diffHours(wd.getHourFrom(), wd.getHourTo());

            // Somma le ore nella mappa temporanea
            rawHoursPerDay.merge(day, hours, Double::sum);
        }

        // Applico la logica ordinarie/straordinarie sulla somma totale
        for (Map.Entry<Integer, Double> entry : rawHoursPerDay.entrySet()) {
            int day = entry.getKey();
            double totalHours = entry.getValue();

            // Aggiungiamo eventuali ore già presenti (caso raro, ma per sicurezza)
            double currentTotal = ordHours[day] + extraHours[day] + totalHours;

            if (currentTotal <= dailyHours) {
                ordHours[day] = currentTotal;
                // extraHours resta invariato (0)
            } else {
                ordHours[day] = dailyHours;
                extraHours[day] = currentTotal - dailyHours;
            }
        }

        // C) REQUESTS
        for (CalendarEntity entity : yearmonthEntities) {
            if (entity.getEntryType() != CalendarEntryType.REQUEST) continue;
            CalendarRequestEntry req = (CalendarRequestEntry) entity.getCalendarEntry();

            if (req.getStatus() != RequestStatus.ACCEPTED) continue;

            LocalDate from = toLocalDate(req.getDateFrom());
            LocalDate to = toLocalDate(req.getDateTo());
            String type = (req.getRequestType() != null) ? req.getRequestType().toUpperCase() : "";

            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                if (d.getYear() != year || d.getMonthValue() != calcMonth) continue;
                int day = d.getDayOfMonth();

                String code = null;
                if (type.contains("FERIE")) code = "FE";
                else if (type.contains("MALATTIA")) code = "MAL";
                else if (type.contains("CONGEDO")) code = "CO";
                else if (type.contains("PERMESSI") || type.contains("PERMESSO")) {
                    if (req.getTimeFrom() != null && req.getTimeTo() != null) {
                        double h = diffHours(req.getTimeFrom(), req.getTimeTo());
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

        // D) AVAILABILITY
        for (CalendarEntity entity : yearmonthEntities) {
            if (entity.getEntryType() != CalendarEntryType.AVAILABILITY) continue;
            CalendarAvailabilityEntry av = (CalendarAvailabilityEntry) entity.getCalendarEntry();

            String projectName = (av.getProject() != null && !av.getProject().isEmpty())
                    ? av.getProject()
                    : "Generico";

            LocalDate from = toLocalDate(av.getDateFrom());
            LocalDate to = toLocalDate(av.getDateTo());

            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                if (d.getYear() != year || d.getMonthValue() != calcMonth) continue;
                availabilityByProject
                        .computeIfAbsent(projectName, k -> new HashSet<>())
                        .add(d.getDayOfMonth());
            }
        }

        // --- 2. FASE DI RENDERING ---
        XSSFWorkbook workbook = new XSSFWorkbook();
        XSSFSheet sheet = workbook.createSheet("Presenze " + year + "-" + String.format("%02d", calcMonth));

        // Stili
        CellStyle borderCenter = workbook.createCellStyle();
        borderCenter.setBorderTop(BorderStyle.THIN);
        borderCenter.setBorderBottom(BorderStyle.THIN);
        borderCenter.setBorderLeft(BorderStyle.THIN);
        borderCenter.setBorderRight(BorderStyle.THIN);
        borderCenter.setAlignment(HorizontalAlignment.CENTER);
        borderCenter.setVerticalAlignment(VerticalAlignment.CENTER);

        CellStyle reperStyle = workbook.createCellStyle();
        reperStyle.cloneStyleFrom(borderCenter);
        reperStyle.setWrapText(true);

        CellStyle borderLeft = workbook.createCellStyle();
        borderLeft.cloneStyleFrom(borderCenter);
        borderLeft.setAlignment(HorizontalAlignment.LEFT);

        Font boldFont = workbook.createFont();
        boldFont.setBold(true);

        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.cloneStyleFrom(borderCenter);
        headerStyle.setFont(boldFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        CellStyle titleStyle = workbook.createCellStyle();
        titleStyle.setAlignment(HorizontalAlignment.LEFT);
        titleStyle.setFont(boldFont);

        // Layout Intestazioni
        Row row2 = sheet.createRow(1);
        createCell(row2, 1, "PRESENZE MESE DI", titleStyle);
        createCell(row2, 2, year + "-" + String.format("%02d", calcMonth), titleStyle);

        Row row4 = sheet.createRow(3);
        Row row5 = sheet.createRow(4);

        createMergedCell(sheet, 3, 4, 0, 0, "Progr.", headerStyle);
        createCell(row4, 1, "Dipendente", headerStyle);
        createCell(row5, 1, "Cognome e nome", headerStyle);
        createCell(row4, 2, "", headerStyle);
        createCell(row5, 2, "", headerStyle);

        int firstDayCol = 3;
        for (int day = 1; day <= daysInMonth; day++) {
            int colIdx = firstDayCol + day - 1;
            LocalDate date = ym.atDay(day);
            createCell(row4, colIdx, dayOfWeekInitial(date.getDayOfWeek()), headerStyle);
            createCell(row5, colIdx, day, headerStyle);
        }

        int colAfterDays = firstDayCol + daysInMonth;
        int reperCol = colAfterDays;
        int noteCol = colAfterDays + 1;

        createMergedCell(sheet, 3, 4, reperCol, reperCol, "Reperibilità", headerStyle);
        createMergedCell(sheet, 3, 4, noteCol, noteCol, "Note", headerStyle);

        // Dati Dipendente
        Row row6 = sheet.createRow(5);
        Row row7 = sheet.createRow(6);
        Row row8 = sheet.createRow(7);

        createMergedCell(sheet, 5, 7, 0, 0, 1, borderCenter);
        createMergedCell(sheet, 5, 7, 1, 1, fullName, borderCenter);

        createCell(row6, 2, "Ore ord", borderCenter);
        createCell(row7, 2, "Ore str", borderCenter);
        createCell(row8, 2, "Giustif", borderCenter);

        // Dati Giornalieri
        for (int day = 1; day <= daysInMonth; day++) {
            int colIdx = firstDayCol + day - 1;
            LocalDate date = ym.atDay(day);
            boolean isWeekend = (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY);

            // 1. ORE ORDINARIE - CAST A INT (Troncamento)
            Cell cOrd = row6.createCell(colIdx);
            cOrd.setCellStyle(borderCenter);
            if (ordHours[day] > 0) {
                cOrd.setCellValue((int) ordHours[day]); // <- Cast a int
            } else if (!isWeekend) {
                cOrd.setCellValue(0);
            }

            // 2. ORE STRAORDINARIE - CAST A INT
            Cell cStr = row7.createCell(colIdx);
            cStr.setCellStyle(borderCenter);
            if (extraHours[day] > 0) {
                cStr.setCellValue((int) extraHours[day]);
            } else if (!isWeekend) {
                cStr.setCellValue(0);
            }

            // 3. GIUSTIFICATIVI
            Cell cGiu = row8.createCell(colIdx);
            cGiu.setCellStyle(borderCenter);
            if (giustificativi[day] != null) {
                cGiu.setCellValue(giustificativi[day]);
            }
        }

        // Reperibilità
        String reperText = buildReperibilitaText(availabilityByProject);
        createMergedCell(sheet, 5, 7, reperCol, reperCol, reperText, reperStyle);

        // Auto-adattamento altezza riga per testo lungo
        if (reperText.length() > 50 || reperText.contains("\n")) {
            float baseHeight = sheet.getDefaultRowHeightInPoints();
            row6.setHeightInPoints(baseHeight * 1.5f);
            row7.setHeightInPoints(baseHeight * 1.5f);
            row8.setHeightInPoints(baseHeight * 1.5f);
        }

        createMergedCell(sheet, 5, 7, noteCol, noteCol, "", borderCenter);

        // Legenda
        int legRowIdx = 10;
        Row legTitleRow = sheet.createRow(legRowIdx++);
        createCell(legTitleRow, 0, "LEGENDA GIUSTIFICATIVI", headerStyle);
        createCell(legTitleRow, 1, "", headerStyle);

        createLegendRow(sheet, legRowIdx++, "FERIE", "FE", borderLeft);
        createLegendRow(sheet, legRowIdx++, "PERMESSI", "PE (es. 4PE = 4 ore)", borderLeft);
        createLegendRow(sheet, legRowIdx++, "MALATTIA", "MAL", borderLeft);
        createLegendRow(sheet, legRowIdx++, "CONGEDO", "CO", borderLeft);
        createLegendRow(sheet, legRowIdx++, "TRASFERTA", "T", borderLeft);

        // Dimensionamento Colonne
        for (int c = firstDayCol; c < colAfterDays; c++) {
            sheet.setColumnWidth(c, 4 * 256);
        }
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
        sheet.setColumnWidth(1, sheet.getColumnWidth(1) + (2 * 256));
        sheet.setColumnWidth(2, 10 * 256);
        sheet.setColumnWidth(reperCol, 25 * 256);
        sheet.setColumnWidth(noteCol, 15 * 256);

        return workbook;
    }

    private static String buildReperibilitaText(Map<String, Set<Integer>> availabilityByProject) {
        if (availabilityByProject.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();
        List<String> projects = new ArrayList<>(availabilityByProject.keySet());
        Collections.sort(projects);

        for (int i = 0; i < projects.size(); i++) {
            String project = projects.get(i);
            Set<Integer> daysSet = availabilityByProject.get(project);
            List<Integer> days = new ArrayList<>(daysSet);
            Collections.sort(days);

            sb.append(project).append(": ");

            int start = days.get(0);
            int prev = start;

            for (int j = 1; j < days.size(); j++) {
                int current = days.get(j);
                if (current == prev + 1) {
                    prev = current;
                } else {
                    appendRange(sb, start, prev);
                    sb.append("g, ");
                    start = prev = current;
                }
            }
            appendRange(sb, start, prev);
            sb.append("g");
            if (i < projects.size() - 1) {
                sb.append("\n");
            }
        }
        return sb.toString();
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
        c0.setCellStyle(style);
        Cell c1 = row.createCell(1);
        c1.setCellValue(code);
        c1.setCellStyle(style);
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
        if (existing.contains(code)) return existing;
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

    private static void appendRange(StringBuilder sb, int start, int end) {
        if (start == end) sb.append(start);
        else sb.append(start).append("-").append(end);
    }
}