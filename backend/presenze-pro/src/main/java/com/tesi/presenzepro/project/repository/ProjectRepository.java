package com.tesi.presenzepro.project.repository;

import com.tesi.presenzepro.project.model.Project;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends MongoRepository<Project, String>, ProjectRepositoryCustom {
    Optional<Project> findById(String id);

    Optional<Project> removeById(String id);

    Optional<List<Project>> findByAssignedToContaining(String email);
}
