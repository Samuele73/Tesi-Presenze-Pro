package com.tesi.presenzepro.user.service;

import com.mongodb.DuplicateKeyException;
import com.tesi.presenzepro.calendar.model.HoursType;
import com.tesi.presenzepro.exception.DuplicateEmailException;
import com.tesi.presenzepro.exception.NoUserFoundException;
import com.tesi.presenzepro.jwt.JwtUtils;
import com.tesi.presenzepro.project.exception.NoUserForProjectFound;
import com.tesi.presenzepro.project.repository.ProjectRepository;
import com.tesi.presenzepro.project.repository.ProjectRepositoryCustomImpl;
import com.tesi.presenzepro.user.dto.*;
import com.tesi.presenzepro.user.mapper.UserMapper;
import com.tesi.presenzepro.user.model.*;
import com.tesi.presenzepro.user.repository.UserTokenRepository;
import com.tesi.presenzepro.user.repository.UserRepository;
import com.tesi.presenzepro.user.repository.UserRepositoryCustomImpl;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

import static com.tesi.presenzepro.user.model.TokenType.PASSWORD_RESET;
import static com.tesi.presenzepro.user.model.TokenType.REGISTRATION;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;
    private final UserRepositoryCustomImpl repositoryCustom;
    private final UserTokenRepository userTokenRepository;
    private final ProjectRepository projectRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final UserDetailsServiceImp userDetailsService;
    private final MessageSource messageSource;
    private final JavaMailSender mailSender;
    private final UserTokenService userTokenService;

    @Value("${spring.app.frontend-port}")
    private String frontendPort;
    @Value("${spring.app.frontend-name}")
    private String frontendName;
    @Value("${spring.app.annualLeaveHours}")
    private Double annualLeaveHours;
    @Value("${spring.app.annualPermitHours}")
    private Double annualPermitHours;

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

    public String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated())
            return null;
        return authentication.getName();
    }

    public List<String> getRoleBasedUsersEmail(){
        final String currentRole = this.getCurrentUserRole();
        final String currentEmail = this.getCurrentUserEmail();
        System.out.println("Current role: " + currentRole);
        System.out.println("Current email: " + currentEmail);
        List<String> usersEmail = new ArrayList<>();
        if(currentRole.equalsIgnoreCase("ADMIN")){
            this.repository.findAll().forEach(u -> {
                final Role uRole = u.getRole();
                if((currentEmail.equals(u.getEmail())) || u.getRole() == Role.USER)
                    usersEmail.add(u.getEmail());
            });
        }else if(currentRole.equalsIgnoreCase("OWNER")){
            this.repository.findAll().forEach(u -> {
                if(!currentEmail.equals(u.getEmail()))
                    usersEmail.add(u.getEmail());
            });
        }else if(currentRole.equalsIgnoreCase("USER"))
            usersEmail.add(currentEmail);
        return usersEmail;
    }

    public boolean isPrivilegedRole(String role) {
        return role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("OWNER");
    }

    public boolean isAdmin(String role) {
        return role.equalsIgnoreCase("ADMIN");
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
            user.setData(new UserData(null, annualLeaveHours, annualPermitHours));
            return repository.save(user);
        }catch (DuplicateKeyException e){
            throw new DuplicateEmailException(user.getUsername());
        }
    }

    public boolean isJwtTokenValid(String token){
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

    public FullUserProfileResponseDto getUserProfile(HttpServletRequest request){
        String email = this.getUserEmailFromRequest(request);
        return this.getUserProfileFromEmail(email);
    }

    public FullUserProfileResponseDto getUserProfileFromEmail(String email){
        User user = repository.findByEmail(email).orElseThrow(() -> new NoUserFoundException("Utente non trovato"));
        return this.userMapper.fromUserToUserProfile(user);
    }

    public FullUserProfileResponseDto updateUserProfile(User updatedUserProfile){
        Optional<User> newUserProfile = repository.findByIdAndModify(updatedUserProfile);
        return newUserProfile.map(userMapper::fromUserToUserProfile).orElse(null);
    }

    public FullUserProfileResponseDto updateUserProfileByEmail(User updatedUserProfile, String email){
        Optional<User> newUserProfile = repository.findByEmailAndModify(updatedUserProfile, email);
        return newUserProfile.map(userMapper::fromUserToUserProfile).orElse(null);
    }

    public BasicUserProfileResponse getBasicUserProfileFromEmail(String email){
        User user = repository.findByEmail(email).orElseThrow(() -> new NoUserFoundException("Utente non trovato"));
        return this.userMapper.fromUserToBasicUserProfile(user);
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
        this.userTokenService.saveUserToken(userEmail, token, PASSWORD_RESET);
        mailSender.send(constructResetTokenEmail("http://" + request.getServerName() + ":" + request.getServerPort(), request.getLocale(), token, userEmail));
        return true;
    }

    public void sendInvitation(String email, HttpServletRequest request){
        if(this.repository.findByEmail(email).isPresent())
            throw new DuplicateEmailException(email);
        String token = UUID.randomUUID().toString();
        this.userTokenService.saveUserToken(email, token, REGISTRATION);
        mailSender.send(constructInvitationTokenEmail("http://" + frontendName + ':' + frontendPort, request.getLocale(), token, email));
    }

    private SimpleMailMessage constructInvitationTokenEmail(String contextPath, Locale locale, String token, String userEmail){
        String url = contextPath + "/signin?token=" + token;
        String body = messageSource.getMessage("message.invitation-token", null, locale);
        return constructEmail("Presenze Pro - Accetta invito", body + " \r\n" + url, userEmail);
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

    public boolean savePassword(NewPasswordDto newPasswordDto){
        System.out.println("TOKEN PER RESET: "  + newPasswordDto.token());
        System.out.println("TOKEN PER RESET: "  + newPasswordDto.password());
        boolean result = this.userTokenService.isUserTokenValid(newPasswordDto.token());

        if(!result){
            System.out.println("Token per salvataggio di una nuova password non presente");
            return false;
        }
        UserToken userToken = this.userTokenRepository.findByToken(newPasswordDto.token());
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

    public UserData getFullUserData(String email) {
        Optional<User> user = repository.findByEmail(email);
        return user.map(userMapper::fromUserToUserData).orElse(null);
    }

    public long updateProjectNameForAll(String projectName, String newProjectName){
        return this.repositoryCustom.updateProjectNameForAllUsers(projectName, newProjectName);
    }

    public List<UserBasicDetailsResponse> getUsersBasicDetails(){
        List<User> users = this.repository.findAll();
        return users.stream().map(this.userMapper::fromUserToUserBasicDetailsResponse).toList();
    }

    public User deleteUserByEmail(String email){
        User deletedUser = this.repository.deleteByEmail(email).orElseThrow(() -> new NoUserFoundException("Nessun utente trovato con questa email: " + email));
        if(deletedUser != null){
            System.out.println("Sto eliminando: "  + deletedUser.getEmail());
            this.projectRepository.removeUserFromAllProjects(email);
        }
        return deletedUser;
    }

    public UserVacationHours getMyVacationHours(HttpServletRequest request){
        String email = this.getUserEmailFromRequest(request);
        User user = repository.findByEmail(email).orElseThrow(() -> new NoUserFoundException("Nessun utente trovato"));
        return this.getRemainingVacationHours(user);
    }

    public UserVacationHours getRemainingVacationHours(User user){
        return new  UserVacationHours(user.getData().annualLeaveHours(), user.getData().annualPermitHours());
    }

    public boolean modifyPermitHours(Double hours, HttpServletRequest request){
        String userEmail = this.getUserEmailFromRequest(request);
        return this.modifyUserHours(hours, HoursType.PERMIT,  userEmail);
    }

    public boolean modifyLeaveHours(Double hours, HttpServletRequest request){
        String userEmail = this.getUserEmailFromRequest(request);
        return this.modifyUserHours(hours, HoursType.LEAVE,  userEmail);
    }

    public boolean modifyUserHours(Double hours, HoursType type, String userEmail){
        return this.repository.updateUserHours(userEmail, hours, type);
    }
}
