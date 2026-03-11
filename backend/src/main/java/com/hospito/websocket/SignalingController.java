package com.hospito.websocket;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    public SignalingController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/signal/{roomId}")
    public void signal(@DestinationVariable String roomId, @Payload SignalMessage message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", message.getType());
        payload.put("senderId", message.getSenderId());
        payload.put("sdp", message.getSdp());
        payload.put("candidate", message.getCandidate());
        payload.put("sdpMid", message.getSdpMid());
        payload.put("sdpMLineIndex", message.getSdpMLineIndex());

        messagingTemplate.convertAndSend("/topic/signal/" + roomId, payload);
    }
}
