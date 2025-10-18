package com.tesi.presenzepro.project.repository;

import com.tesi.presenzepro.project.model.Project;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ProjectRepository extends MongoRepository<Project, String> {

}
