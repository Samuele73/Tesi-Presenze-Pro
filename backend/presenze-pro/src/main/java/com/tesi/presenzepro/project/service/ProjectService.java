package com.tesi.presenzepro.project.service;

import com.tesi.presenzepro.project.dto.CreateProjectRequest;
import com.tesi.presenzepro.project.exception.NoUserForProjectFound;
import com.tesi.presenzepro.project.mapper.ProjectMapper;
import com.tesi.presenzepro.project.model.Project;
import com.tesi.presenzepro.project.repository.ProjectRepository;
import com.tesi.presenzepro.user.service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class ProjectService {
    private ProjectRepository projectRepository;
    private UserService userService;
    private ProjectMapper projectMapper;

    public List<Project> findAllProjects(){
        return this.projectRepository.findAll();
    }

    public Project saveProject(CreateProjectRequest project){
        if (project.assignedTo() != null && !project.assignedTo().isEmpty()) {
            project.assignedTo().forEach(email -> {
                this.userService.findByEmail(email)
                        .orElseThrow(() -> new NoUserForProjectFound(email));
                this.userService.addUserProjectByEmail(email, project.name());
            });
        }
        final Project finalProject = this.projectMapper.fromCreateRequestToProject(project);
        return this.projectRepository.save(finalProject);
    }


}
