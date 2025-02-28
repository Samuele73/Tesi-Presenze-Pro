package com.tesi.presenzepro.user;

import org.springframework.stereotype.Service;

@Service
public class UserMapper {

    public User fromSigninToUser(UserAuthRequestDto dto){
        return User.builder()
                .name(dto.name())
                .surname(dto.surname())
                .email(dto.email())
                .pwd(dto.password())
                .role(Role.USER) //STIAMO ASSUMENDO SIANO TUTTI USER. TOGLIERE QUANDO SI AGGIUNGONO ALTRI RUOLI
                .build();
    }

    public User fromLoginToUser(UserAuthRequestDto dto){
        return User.builder()
                .email(dto.email())
                .pwd(dto.password())
                .build();
    }



    public UserProfile fromUserToUserProfile(User dto){
        return new UserProfile(dto.getName(), dto.getSurname(), dto.getEmail(), dto.getSerialNum(), dto.getDuty(), dto.getEmploymentType(), dto.getHireDate(), dto.getBirthDate(), dto.getAddress(), dto.getPhone(), dto.getIban(), dto.getRole());
    }
}
