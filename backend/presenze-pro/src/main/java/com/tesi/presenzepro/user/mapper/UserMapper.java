package com.tesi.presenzepro.user.mapper;

import com.tesi.presenzepro.user.dto.LoginRequestDto;
import com.tesi.presenzepro.user.dto.ProfileResponseDto;
import com.tesi.presenzepro.user.model.Role;
import com.tesi.presenzepro.user.model.User;
import com.tesi.presenzepro.user.model.UserData;
import com.tesi.presenzepro.user.model.UserProfile;
import com.tesi.presenzepro.user.dto.SignInRequestDto;
import org.springframework.stereotype.Service;

@Service
public class UserMapper {

    public User fromSigninToUser(SignInRequestDto dto){
        return User.builder()
                .profile(new UserProfile(dto.name(), dto.surname()))
                .email(dto.email())
                .pwd(dto.password())
                .role(Role.USER) // Si assume che i privilegi superiori vengano messi manualmente.
                .build();
    }

    public User fromLoginToUser(LoginRequestDto dto){
        return User.builder()
                .email(dto.email())
                .pwd(dto.password())
                .build();
    }

    public ProfileResponseDto fromUserToUserProfile(User user){
        final UserProfile userProfile = user.getProfile();
        if (userProfile == null) {
            return new ProfileResponseDto(
                    null, null, null, null, null, null,
                    null, null, null, null,
                    user.getEmail(),
                    user.getRole()
            );
        }
        return new ProfileResponseDto(
                userProfile.name(),
                userProfile.surname(),
                userProfile.serialNum(),
                userProfile.duty(),
                userProfile.employmentType(),
                userProfile.hireDate(),
                userProfile.birthDate(),
                userProfile.address(),
                userProfile.phone(),
                userProfile.iban(),
                user.getEmail(),
                user.getRole()
        );
    }

    public UserData fromUserToUserData(User user){
        return new UserData(user.getData().assignedProjects());
    }
}
