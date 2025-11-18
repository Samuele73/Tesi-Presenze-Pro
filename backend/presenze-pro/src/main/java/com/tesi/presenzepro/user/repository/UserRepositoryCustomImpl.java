package com.tesi.presenzepro.user.repository;

import com.mongodb.client.result.UpdateResult;
import com.tesi.presenzepro.calendar.model.HoursType;
import com.tesi.presenzepro.user.model.User;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;
import java.util.Optional;

public class UserRepositoryCustomImpl implements UserRepositoryCustom {

    private final MongoTemplate mongoTemplate;
    @Value("${spring.app.annualLeaveHours}")
    private double maxAnnualLeaveHours;
    @Value("${spring.app.annualPermitHours}")
    private double maxAnnualPermitHours;

    public UserRepositoryCustomImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Optional<User> findByIdAndModify(User user) {
        return this.findByEmailAndModify(user, user.getEmail());
    }

    @Override
    public Optional<User> findByEmailAndModify(User user, String email) {
        Query query = new Query().addCriteria(Criteria.where("email").is(email));
        Update update = new Update();

        // Aggiornamento campi di User
        if(user.getRole() != null)
            update.set("role", user.getRole());
        if(user.getPwd() != null)
            update.set("pwd", user.getPwd());

        // Aggiornamento UserProfile (dati anagrafici + lavorativi)
        if(user.getProfile() != null) {
            if(user.getProfile().name() != null)
                update.set("profile.name", user.getProfile().name());
            if(user.getProfile().surname() != null)
                update.set("profile.surname", user.getProfile().surname());
            if(user.getProfile().serialNum() != null)
                update.set("profile.serialNum", user.getProfile().serialNum());
            if(user.getProfile().duty() != null)
                update.set("profile.duty", user.getProfile().duty());
            if(user.getProfile().employmentType() != null)
                update.set("profile.employmentType", user.getProfile().employmentType());
            if(user.getProfile().hireDate() != null)
                update.set("profile.hireDate", user.getProfile().hireDate());
            if(user.getProfile().birthDate() != null)
                update.set("profile.birthDate", user.getProfile().birthDate());
            if(user.getProfile().address() != null)
                update.set("profile.address", user.getProfile().address());
            if(user.getProfile().phone() != null)
                update.set("profile.phone", user.getProfile().phone());
            if(user.getProfile().iban() != null)
                update.set("profile.iban", user.getProfile().iban());
        }

        // Aggiornamento UserData (solo progetti assegnati)
        if(user.getData() != null) {
            if(user.getData().assignedProjects() != null)
                update.set("data.assignedProjects", user.getData().assignedProjects());
        }

        FindAndModifyOptions options = new FindAndModifyOptions().returnNew(true).upsert(false);
        User newUpdatedUser = mongoTemplate.findAndModify(query, update, options, User.class);

        System.out.println(newUpdatedUser + " query: " + query + " update: " + update);

        return Optional.ofNullable(newUpdatedUser);
    }

    public Optional<User> addProjectByEmail(String email, String projectName) {
        Query query = new Query().addCriteria(Criteria.where("email").is(email));
        Update update = new Update().addToSet("data.assignedProjects", projectName);

        FindAndModifyOptions options = new FindAndModifyOptions().returnNew(true).upsert(false);
        User updatedUser = mongoTemplate.findAndModify(query, update, options, User.class);

        return Optional.ofNullable(updatedUser);
    }

    public long updateProjectNameForAllUsers(String oldProjectName, String newProjectName) {
        Query query = new Query().addCriteria(
                Criteria.where("data.assignedProjects").is(oldProjectName)
        );

        Update update = new Update()
                .set("data.assignedProjects.$", newProjectName);

        UpdateResult result = mongoTemplate.updateMulti(query, update, User.class);

        return result.getModifiedCount();
    }

    public long removeProjectFromUsers(List<String> emails, String projectName) {
        Query query = new Query().addCriteria(
                Criteria.where("email").in(emails)
        );

        Update update = new Update()
                .pull("data.assignedProjects", projectName);

        UpdateResult result = mongoTemplate.updateMulti(query, update, User.class);

        return result.getModifiedCount();
    }

    @Override
    public boolean updateUserHours(String email, double hoursDelta, HoursType type) {

        Query query = new Query().addCriteria(Criteria.where("email").is(email));
        User user = mongoTemplate.findOne(query, User.class);

        if (user == null || user.getData() == null) {
            System.out.println("non trovo l utente");
            return false;
        }

        double currentHours;
        double maxAllowed;
        String fieldPath;

        switch (type) {
            case LEAVE -> {
                currentHours = user.getData().annualLeaveHours();
                maxAllowed = this.maxAnnualLeaveHours;
                fieldPath = "data.annualLeaveHours";
            }
            case PERMIT -> {
                currentHours = user.getData().annualPermitHours();
                maxAllowed = this.maxAnnualPermitHours;
                fieldPath = "data.annualPermitHours";
            }
            default -> {
                System.out.println("SONO ih default");
                return false;
            }
        }

        double newValue = currentHours + hoursDelta;

        if (newValue < 0) {
            System.out.println("il nuovo valore è sotto lo zero: " + newValue + " altro valore: " + hoursDelta);
            return false;
        }

        if (newValue > maxAllowed) {
            newValue = maxAllowed;
        }

        // 5. Aggiornamento DB
        Update update = new Update().set(fieldPath, newValue);
        FindAndModifyOptions options = FindAndModifyOptions.options().returnNew(true);

        User updated = mongoTemplate.findAndModify(query, update, options, User.class);

        return updated != null;
    }

}