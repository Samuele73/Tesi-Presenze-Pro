package com.tesi.presenzepro.user.controller;

import com.tesi.presenzepro.user.dto.*;
import com.tesi.presenzepro.user.model.User;
import com.tesi.presenzepro.user.model.UserData;
import com.tesi.presenzepro.user.service.UserService;
import com.tesi.presenzepro.user.service.UserTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
@CrossOrigin(origins = "http://localhost:4200")
@Tag(name = "User", description = "Operazioni relative all'utente")
public class UserController {

    private final UserService service;
    private final UserTokenService userTokenService;
    private final HttpServletResponse httpServletResponse;

    @PostMapping("/login")
    public ResponseEntity<UserAuthResponseDto> login(@RequestBody LoginRequestDto user){
        return ResponseEntity.ok(service.login(user));
    }

    @GetMapping("/refresh-token")
    public ResponseEntity<UserAuthResponseDto> refreshToken(){
        return ResponseEntity.ok(service.refreshMyToken());
    }

    @PostMapping("/signin")
    public ResponseEntity<User> signIn(@RequestBody SignInRequestDto user){
        User savedUser = service.signIn(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    @Operation(description = "Valida il token inviato")
    @PostMapping("/secure")
    public ResponseEntity<Boolean> validToken(@RequestBody String token){
        final boolean isTokenValid = service.isJwtTokenValid(token);
        return ResponseEntity.status(HttpStatus.OK).body(isTokenValid);
    }

    @Operation(description = "Ottieni il profilo utente",security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/profile")
    public ResponseEntity<FullUserProfileResponseDto> getMyUserProfile(HttpServletRequest request){
         final FullUserProfileResponseDto user = service.getFullUserProfileResponseDtoFromRequest(request);
        System.out.println("profile user: " + user);
         return ResponseEntity.ok(user);
    }

    @PreAuthorize("hasRole('OWNER')")
    @Operation(description = "Ottieni l'intero profilo dell'utente indicati (permessi permettendo)",security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/full-profile/{email}")
    public ResponseEntity<FullUserProfileResponseDto> getFullUserProfile(@PathVariable String email){
        final FullUserProfileResponseDto user = service.getFullUserProfileResponseDtoFromEmail(email);
        System.out.println("profile user: " + user);
        return ResponseEntity.ok(user);
    }

    @Operation(description = "Ottieni il profilo base dell'utente indicato",security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/basic-profile/{email}")
    public ResponseEntity<BasicUserProfileResponse> getBasicUserProfile(@PathVariable String email){
        final BasicUserProfileResponse user = service.getBasicUserProfileFromEmail(email);
        System.out.println("profile user: " + user);
        return ResponseEntity.ok(user);
    }

    @Operation(description = "Ottieni il campo dati dell'utente in base al tkn nell'headder", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/data")
    public ResponseEntity<UserData> getUserData(HttpServletRequest request){
        final UserData userData = service.getUserDataFromRequest(request);
        return ResponseEntity.ok(userData);
    }
    
    //Implementare il metodo di aggiornamento
    @Operation(description = "Modifica le credenziali del profilo utente", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/profile")
    public ResponseEntity<FullUserProfileResponseDto> updateUserProfile(@RequestBody User updatedUserProfile){
        final FullUserProfileResponseDto newProfile = service.updateUserProfile(updatedUserProfile);
        return ResponseEntity.status(HttpStatus.OK).body(newProfile);
    }

    @PreAuthorize("hasRole('OWNER')")
    @Operation(description = "Modifica le credenziali del profilo utente", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/profile/{email}")
    public ResponseEntity<FullUserProfileResponseDto> updateUserProfileByEmail(@RequestBody User updatedUserProfile, @PathVariable String email){
        final FullUserProfileResponseDto newProfile = service.updateUserProfileByEmail(updatedUserProfile, email);
        return ResponseEntity.status(HttpStatus.OK).body(newProfile);
    }

    //Rotta raggiunta tramite la pagina di password dimenticata. genera l'email
    @Operation(description = "Richiede il reset della password. Consegue l'invio di una email", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/resetPassword")
    public ResponseEntity<?> resetPassword(HttpServletRequest request, @RequestBody String email){
        if(this.service.resetPassword(email, request))
            return ResponseEntity.ok().build();
        return ResponseEntity.notFound().build();
    }

    //Rotta raggiunta tramite il link presente nella email per la modifica della password
    @Operation(description = "Redirect a pagina per il cambio password. Rotta raggiunta tramite il link nella email di richiesta password")
    @GetMapping("/changePassword")
    public void showChangePasswordPage(HttpServletResponse httpServletResponse, @RequestParam("token") String token) throws IOException {
        if(!this.userTokenService.isUserTokenValid(token)){
            httpServletResponse.sendRedirect("http://localhost:4200/login"); //In produzione cambiare l'indirizzo. In generale impostalo dalle properties
            return;
        }
        httpServletResponse.sendRedirect("http://localhost:4200/updatePassword?token=" + token);
    }

    //Rotta utilizzato per il salvataggio di una nuova password dopo aver richiesto ed utilizzato l'email di conferma
    @Operation(description = "Cambio della password con quella nuova indicata", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/savePassword")
    public ResponseEntity<?> saveNewPassword(@RequestBody NewPasswordDto newPasswordDto){
        this.service.savePassword(newPasswordDto);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @Operation(description = "Manda invito per la registrazione di un nuovo account utente", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/send-invitation")
    public ResponseEntity<Boolean> sendInvitationByEmail(@RequestBody String email, HttpServletRequest request){
        this.service.sendInvitation(email, request);
        return ResponseEntity.ok(true);
    }

    @Operation(description = "Ottieni l'email dal token di invito (se valido)", security = @SecurityRequirement(name = "bearerAuth"))
   @GetMapping("/invitation-details")
    public ResponseEntity<UserEmailResponse> getEmailFromInvitation(@RequestParam("token") String token){
        String userEmail = this.userTokenService.getEmailFromUserTknValidation(token);
        System.out.println("userEmail: " + userEmail);
        return ResponseEntity.ok(new UserEmailResponse(userEmail));
   }


    @Operation(description = "Ottenimento dell'email interna al token indicato", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/getEmailFromJwt")
    public ResponseEntity<UserEmailResponse> getEmailFromTkn(@RequestBody String token){
        System.out.println("AO GUARDA: " + token);
        String userEmail = this.service.getEmailFromTkn(token);
        System.out.println("User email: " + userEmail);
        return ResponseEntity.ok(new UserEmailResponse(userEmail));
    }

    //@PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    @Operation(description = "Ottieni informazioni di base su tutti gli utenti", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/all-basic-details")
    public ResponseEntity<List<UserBasicDetailsResponse>> getUsersBasicDetails(){
        List<UserBasicDetailsResponse> usersBasicDetails = this.service.getUsersBasicDetails();
        return ResponseEntity.ok(usersBasicDetails);
    }

    @Operation(description = "Ottieni informazioni di base su tutti gli utenti", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/users-email")
    public ResponseEntity<List<String>> getRoleBasedUsersEmail(){
        List<String> usersEmail = this.service.getRoleBasedUsersEmail();
        System.out.println("controlla: " + usersEmail);
        return ResponseEntity.ok(usersEmail);
    }

    @PreAuthorize("hasRole('OWNER')")
    @Operation(description = "Rimuovi un utente per email", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{email}")
    public ResponseEntity<User> deleteUserByEmail(@PathVariable String email){
        User deletedUser = this.service.deleteUserByEmail(email);
        return ResponseEntity.ok(deletedUser);
    }

    @Operation(description = "Prendi le ore festive rimanenti dell'utente, per ferie e permessi", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/my-remaining-holiday-hours")
    public ResponseEntity<UserVacationHours> getMyRemainingHolidayHours(HttpServletRequest request){
        UserVacationHours remainingVacationHours = this.service.getMyVacationHours(request);
        return ResponseEntity.ok(remainingVacationHours);
    }

}
