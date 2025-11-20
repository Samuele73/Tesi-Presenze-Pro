package com.tesi.presenzepro.user.mapper;

import com.tesi.presenzepro.user.dto.*;
import com.tesi.presenzepro.user.model.Role;
import com.tesi.presenzepro.user.model.User;
import com.tesi.presenzepro.user.model.UserData;
import com.tesi.presenzepro.user.model.UserProfile;
import org.springframework.stereotype.Service;

@Service
public class UserMapper {

    public User fromSigninToUser(SignInRequestDto dto){
        return User.builder()
                .profile(new UserProfile(dto.name(), dto.surname()))
                .email(dto.email())
                .pwd(dto.password())
                .role(Role.USER)
                .data(new UserData(null, 0.0, 0.0, 0))// Si assume che i privilegi superiori vengano messi manualmente.
                .build();
    }

    public User fromLoginToUser(LoginRequestDto dto){
        return User.builder()
                .email(dto.email())
                .pwd(dto.password())
                .build();
    }

    public FullUserProfileResponseDto fromUserToFullUserProfileResponseDto(User user){
        final UserProfile userProfile = user.getProfile();
        if (userProfile == null) {
            return new FullUserProfileResponseDto(
                    null, null, null, null, null, null,
                    null, null, null, null,
                    user.getEmail(),
                    user.getRole()
            );
        }
        return new FullUserProfileResponseDto(
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

    public UserBasicDetailsResponse fromUserToUserBasicDetailsResponse(User user){
        final UserProfile userProfile = user.getProfile();
        return new UserBasicDetailsResponse(
                userProfile.name(),
                userProfile.surname(),
                user.getEmail(),
                userProfile.duty(),
                user.getRole()
        );
    }

    public BasicUserProfileResponse fromUserToBasicUserProfile(User user){
        final UserProfile userProfile = user.getProfile();
        return new BasicUserProfileResponse(
                userProfile.name(),
                userProfile.surname(),
                user.getEmail()
        );
    }

    public UserData fromUserToUserData(User user){
        return new UserData(user.getData().assignedProjects(), user.getData().annualLeaveHours(), user.getData().annualPermitHours(), user.getData().dailyHours());
    }

    public UserProfile fromUserToUserProfile(User user){
        return user.getProfile();
    }
}
