package com.tesi.presenzepro.user.repository;

import com.tesi.presenzepro.user.model.User;

import java.util.Optional;

public interface UserRepositoryCustom {
    Optional<User> findByIdAndModify(User user);
}
