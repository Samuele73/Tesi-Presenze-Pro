package com.tesi.presenzepro.notification.service;

import com.tesi.presenzepro.notification.model.NotificationPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void send(String email, String message) {
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + email,
                new NotificationPayload(message)
        );
    }
}
