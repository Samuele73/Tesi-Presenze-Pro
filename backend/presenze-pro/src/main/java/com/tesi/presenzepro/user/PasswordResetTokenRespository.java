package com.tesi.presenzepro.user;

import org.springframework.data.mongodb.repository.MongoRepository;

import javax.swing.text.html.Option;
import java.util.Optional;

public interface PasswordResetTokenRespository extends MongoRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByUserEmail(String userEmail);

    Optional<PasswordResetToken> deleteAllByUserEmail(String userEmail);

    PasswordResetToken findByToken(String token);
}

