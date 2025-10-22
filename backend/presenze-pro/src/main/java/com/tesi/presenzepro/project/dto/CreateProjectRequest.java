package com.tesi.presenzepro.project.dto;

import java.util.List;

public record CreateProjectRequest(
        String name,
        String description,
        String summary,
        List<String> assignedTo
) {
}
