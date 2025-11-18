package com.tesi.presenzepro.user.repository;

import com.tesi.presenzepro.calendar.model.HoursType;
import com.tesi.presenzepro.user.model.User;

import java.util.Optional;

public interface UserRepositoryCustom {
    Optional<User> findByIdAndModify(User user);
    Optional<User> findByEmailAndModify(User user, String email);
    boolean updateUserHours(String email, double hoursDelta, HoursType type);
}
