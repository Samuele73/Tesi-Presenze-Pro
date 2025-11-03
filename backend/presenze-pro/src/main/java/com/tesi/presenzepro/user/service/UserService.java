package com.tesi.presenzepro.user.service;

import com.mongodb.DuplicateKeyException;
import com.tesi.presenzepro.exception.DuplicateEmailException;
import com.tesi.presenzepro.jwt.JwtUtils;
import com.tesi.presenzepro.project.model.Project;
import com.tesi.presenzepro.user.dto.*;
import com.tesi.presenzepro.user.mapper.UserMapper;
import com.tesi.presenzepro.user.model.*;
import com.tesi.presenzepro.user.repository.PasswordResetTokenRespository;
import com.tesi.presenzepro.user.repository.UserRepository;
import com.tesi.presenzepro.user.repository.UserRepositoryCustomImpl;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;
    private final UserRepositoryCustomImpl repositoryCustom;
    private final PasswordResetTokenRespository resetTokenRespository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final UserDetailsServiceImp userDetailsService;
    private final MessageSource messageSource;
    private final JavaMailSender mailSender;

    private boolean isUserInvalid(User user){
        return user.getEmail().isBlank() || user.getPwd().isBlank();
    }

    public String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated())
            return null;

        return authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse(null);
    }

    public UserAuthResponseDto login(LoginRequestDto userDto){
        User userRequest = userMapper.fromLoginToUser(userDto);
        System.out.println(userRequest);
        if(isUserInvalid(userRequest))
            return null;
        authenticationManager.authenticate( //STUDIARE MOLTO BENE QUESTO
                new UsernamePasswordAuthenticationToken(
                        userRequest.getUsername(),
                        userRequest.getPassword()
                )
        );
        User user = repository.findByEmail(userRequest.getEmail()).orElseThrow();
        //STUDIANDO AUTHENTICATION MANAGER NON SERVE QUESTO IF ELSE. PRIMA STUDIARLO E POI TOGLIERLO
        if(passwordEncoder.matches(userRequest.getPwd(), user.getPwd())){
            String token = jwtUtils.generateTokenFromUsername(user);
            return new UserAuthResponseDto(token);
        }
        else
            return null;
    }

    public User signIn(SignInRequestDto userDto){
        User user = userMapper.fromSigninToUser(userDto);
        if(isUserInvalid(user))
            throw new IllegalArgumentException("Invalid user data");
        if(repository.findByEmail(user.getUsername()).isPresent())
            throw new DuplicateEmailException(user.getUsername());
        user.setPwd(passwordEncoder.encode(user.getPwd()));
        try{
            return repository.save(user);
        }catch (DuplicateKeyException e){
            throw new DuplicateEmailException(user.getUsername());
        }
    }

    public boolean isTokenValid(String token){
        String email = jwtUtils.getUsernameFromJwt(token);
        if(email != null){
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            return jwtUtils.validateJwtToken(token);
        }
        System.out.println("ERRORE: Errore nell'estrazione dell'email nella verifica del token");
        return false;
    }

    public Optional<User> findByEmail(String email){
        return repository.findByEmail(email);
    }

    private String getUserEmailFromRequest(HttpServletRequest request){
        final String tkn = jwtUtils.getJwtFromHeader(request);
        if(tkn == null){
            throw new JwtException("token is null");
        }
        return jwtUtils.getUsernameFromJwt(tkn);
    }

    public ProfileResponseDto getUserProfile(HttpServletRequest request){
        String email = this.getUserEmailFromRequest(request);
        Optional<User> user = repository.findByEmail(email);
        return user.map(userMapper::fromUserToUserProfile).orElse(null);
    }

    public ProfileResponseDto updateUserProfile(User updatedUserProfile){
        Optional<User> newUserProfile = repository.findByIdAndModify(updatedUserProfile);
        return newUserProfile.map(userMapper::fromUserToUserProfile).orElse(null);
    }

    public boolean addUserProjectByEmail(String email, String projectName){
        Optional<User> user = repositoryCustom.addProjectByEmail(email, projectName);
        return user.isPresent();
    }

    public long removeProjectFromUsers(List<String> emails, String projectName){
        return repositoryCustom.removeProjectFromUsers(emails, projectName);
    }

    public boolean resetPassword(String userEmail, HttpServletRequest request){
        if(this.repository.findByEmail(userEmail).isEmpty())
            return false;
        String token = UUID.randomUUID().toString();
        createPasswordResetTokenForUser(userEmail, token);
        mailSender.send(constructResetTokenEmail("http://" + request.getServerName() + ":" + request.getServerPort(), request.getLocale(), token, userEmail));
        return true;
    }

    public boolean sendInvitation(String email, HttpServletRequest request){
        if(this.repository.findByEmail(email).isPresent())
            throw new DuplicateEmailException(email);
        String token = UUID.randomUUID().toString();
        saveRegistrationToken(email, token);
        return false;
    }

    private void saveRegistrationToken(String email, String token){
        RegistrationToken registrationToken = new RegistrationToken(email, token);

    }

    private void createPasswordResetTokenForUser(String userEmail, String token){
        PasswordResetToken myToken = new PasswordResetToken(token, userEmail);
        this.resetTokenRespository.deleteAllByUserEmail(userEmail);
        this.resetTokenRespository.save(myToken); //modificare per far si che venga controllato se esiste già un token e resettarlo
    }

    private SimpleMailMessage constructResetTokenEmail(String contextPath, Locale locale, String token, String userEmail){
        String url = contextPath + "/users/changePassword?token=" + token;
        String body = messageSource.getMessage("message.resetPassword", null, locale);
        return constructEmail("Reset password", body + " \r\n" + url, userEmail);
    }

    private SimpleMailMessage constructEmail(String subject, String body, String userEmail){
        SimpleMailMessage email = new SimpleMailMessage();
        email.setSubject(subject);
        email.setText(body);
        email.setTo(userEmail);
        email.setFrom("samuimpact1@gmail.com");
        return email;
    }

    public boolean showChangePasswordPage(String token){
        String result = validatePasswordResetToken(token);
        if(result != null)
            return false;
        return true;
    }

    public String validatePasswordResetToken(String token){
        final PasswordResetToken resetToken = resetTokenRespository.findByToken(token);
        return !isTokenFound(resetToken) ? "invalidToken"
                : isTokenExpired(resetToken) ? "expiredToken"
                : null;
    }

    private boolean isTokenFound(PasswordResetToken resetToken){
        return resetToken != null;
    }

    private boolean isTokenExpired(PasswordResetToken resetToken){
        final Calendar cal = Calendar.getInstance();
        return resetToken.getExpiryDate().before(cal.getTime());
    }

    public boolean savePassword(NewPasswordDto newPasswordDto){
        System.out.println("TOKEN PER RESET: "  + newPasswordDto.token());
        System.out.println("TOKEN PER RESET: "  + newPasswordDto.password());
        String result = validatePasswordResetToken(newPasswordDto.token());

        if(result != null){
            System.out.println("Token per salvataggio di una nuova password non presente");
            return false;
        }
        PasswordResetToken userToken = this.resetTokenRespository.findByToken(newPasswordDto.token());
        if(userToken != null){
            Optional<User> user = this.repository.findByEmail(userToken.getUserEmail());
            if(user.isPresent()){
                User theUser = user.get();
                System.out.println("UTENTE DA MODIFICAREEEEEEEEEEEEEE" + theUser);
                theUser.setPwd(passwordEncoder.encode(newPasswordDto.password()));
                Optional<User> userResult = this.repository.findByIdAndModify(theUser);
                if(userResult.isPresent())
                    return true;
            }
        }
        System.out.println("Errore con il salvataggio della nuova password");
        return false;
    }

    public String getEmailFromTkn(String tkn){
        return jwtUtils.getUsernameFromJwt(tkn);
    }

    public UserData getUserData(HttpServletRequest request) {
        String email = this.getUserEmailFromRequest(request);
        Optional<User> user = repository.findByEmail(email);
        return user.map(userMapper::fromUserToUserData).orElse(null);
    }

    public long updateProjectNameForAll(String projectName, String newProjectName){
        return this.repositoryCustom.updateProjectNameForAllUsers(projectName, newProjectName);
    }
}
