package com.tesi.presenzepro.notification.service;

import com.tesi.presenzepro.notification.model.NotificationPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void send(String email, String message) {
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + email,
                new NotificationPayload(message)
        );
        System.out.println("NOTIFICA MANDATA: " + message + " a " + email);
    }

    public void notifyChangedToken(String email) {
        String destination = "/topic/token-updates/" + email;

        Map<String, String> payload = new HashMap<>();
        payload.put("event", "TOKEN_INVALIDATED");
        payload.put("email", email);

        messagingTemplate.convertAndSend(destination, payload);
    }
}
