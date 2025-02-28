package com.tesi.presenzepro.user;

import java.util.Optional;

public interface UserRepositoryCustom {
    Optional<User> findByIdAndModify(User user);
}
