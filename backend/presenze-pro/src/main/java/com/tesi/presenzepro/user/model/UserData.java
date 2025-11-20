package com.tesi.presenzepro.user.model;

import java.util.List;

public record UserData(
        List<String> assignedProjects,
        Double annualLeaveHours,
        Double annualPermitHours,
        Integer dailyHours
) {
}
