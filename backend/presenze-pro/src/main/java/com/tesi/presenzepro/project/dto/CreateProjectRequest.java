package com.tesi.presenzepro.project.dto;

import java.util.List;

public record CreateProjectRequest(
        String name,
        String description,
        List<String> assignedTo
) {
}
