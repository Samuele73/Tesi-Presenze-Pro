package com.tesi.presenzepro.user.repository;

import com.tesi.presenzepro.user.model.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PasswordResetTokenRespository extends MongoRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByUserEmail(String userEmail);

    Optional<PasswordResetToken> deleteAllByUserEmail(String userEmail);

    PasswordResetToken findByToken(String token);
}

