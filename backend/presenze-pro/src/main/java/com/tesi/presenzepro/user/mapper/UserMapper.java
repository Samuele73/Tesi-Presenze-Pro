package com.tesi.presenzepro.user.mapper;

import com.tesi.presenzepro.user.dto.LoginRequestDto;
import com.tesi.presenzepro.user.model.Role;
import com.tesi.presenzepro.user.model.User;
import com.tesi.presenzepro.user.model.UserProfile;
import com.tesi.presenzepro.user.dto.SignInRequestDto;
import org.springframework.stereotype.Service;

@Service
public class UserMapper {

    public User fromSigninToUser(SignInRequestDto dto){
        return User.builder()
                .name(dto.name())
                .surname(dto.surname())
                .email(dto.email())
                .pwd(dto.password())
                .role(Role.USER) //STIAMO ASSUMENDO SIANO TUTTI USER. TOGLIERE QUANDO SI AGGIUNGONO ALTRI RUOLI
                .build();
    }

    public User fromLoginToUser(LoginRequestDto dto){
        return User.builder()
                .email(dto.email())
                .pwd(dto.password())
                .build();
    }



    public UserProfile fromUserToUserProfile(User dto){
        return new UserProfile(dto.getName(), dto.getSurname(), dto.getEmail(), dto.getSerialNum(), dto.getDuty(), dto.getEmploymentType(), dto.getHireDate(), dto.getBirthDate(), dto.getAddress(), dto.getPhone(), dto.getIban(), dto.getRole());
    }
}
