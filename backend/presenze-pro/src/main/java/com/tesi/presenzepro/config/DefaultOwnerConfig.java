package com.tesi.presenzepro.config;

import com.tesi.presenzepro.user.model.Role;
import com.tesi.presenzepro.user.model.User;
import com.tesi.presenzepro.user.model.UserData;
import com.tesi.presenzepro.user.model.UserProfile;
import com.tesi.presenzepro.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;

@Configuration
@RequiredArgsConstructor
public class DefaultOwnerConfig {


    @Value("${spring.app.defaultOwnerEmail}")
    private String defaultEmail;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner createDefaultOwner(UserRepository userRepository) {
        return args -> {
            if(defaultEmail.isEmpty()) {
                System.out.println("Default owner email is empty");
                return;
            }
            String email = defaultEmail;
            if (userRepository.findByEmail(email).isPresent()) {
                return;
            }
            UserProfile profile = new UserProfile("Owner", "Account");
            UserData data = new UserData(
                    Collections.emptyList(), // nessun progetto assegnato
                    0.0,                     // ferie
                    0.0,                     // permessi
                    8                       // ore giornaliere
            );

            // ✔️ Costruisco l'utente OWNER
            User owner = User.builder()
                    .email(email)
                    .pwd(passwordEncoder.encode("owner123"))
                    .role(Role.OWNER)
                    .profile(profile)
                    .data(data)
                    .build();

            userRepository.save(owner);
            System.out.println(">>> Utente OWNER creato automaticamente: " + email);
        };
    }
}