package com.tesi.presenzepro.project.mapper;

import com.tesi.presenzepro.project.dto.CreateProjectRequest;
import com.tesi.presenzepro.project.model.Project;
import com.tesi.presenzepro.project.model.ProjectStatus;
import org.springframework.stereotype.Service;

@Service
public class ProjectMapper {
    public Project fromCreateRequestToProject(CreateProjectRequest createProjectRequest){
        return Project.builder().name(createProjectRequest.name()).description(createProjectRequest.description()).assignedTo(createProjectRequest.assignedTo()).status(ProjectStatus.valueOf("CREATED")).summary(createProjectRequest.summary()).build();
    }
}
