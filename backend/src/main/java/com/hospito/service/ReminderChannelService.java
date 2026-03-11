package com.hospito.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class ReminderChannelService {

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${hospito.reminder.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${hospito.reminder.whatsapp.enabled:false}")
    private boolean whatsappEnabled;

    @Value("${hospito.reminder.default-country-code:+91}")
    private String defaultCountryCode;

    @Value("${hospito.reminder.twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${hospito.reminder.twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${hospito.reminder.twilio.from-number:}")
    private String twilioFromNumber;

    @Value("${hospito.reminder.twilio.whatsapp-from:}")
    private String twilioWhatsAppFrom;

    public ChannelDeliveryResult sendSms(String toPhone, String body) {
        if (!smsEnabled) {
            return ChannelDeliveryResult.failed("SMS channel disabled");
        }

        if (!hasTwilioCredentials() || twilioFromNumber.isBlank()) {
            return ChannelDeliveryResult.failed("SMS gateway not configured");
        }

        String normalizedTo = normalizePhone(toPhone);
        if (normalizedTo == null) {
            return ChannelDeliveryResult.failed("Invalid recipient phone");
        }

        return sendTwilioMessage(normalizedTo, normalizePhone(twilioFromNumber), body);
    }

    public ChannelDeliveryResult sendWhatsApp(String toPhone, String body) {
        if (!whatsappEnabled) {
            return ChannelDeliveryResult.failed("WhatsApp channel disabled");
        }

        if (!hasTwilioCredentials() || twilioWhatsAppFrom.isBlank()) {
            return ChannelDeliveryResult.failed("WhatsApp gateway not configured");
        }

        String normalizedTo = normalizePhone(toPhone);
        if (normalizedTo == null) {
            return ChannelDeliveryResult.failed("Invalid recipient phone");
        }

        String to = "whatsapp:" + normalizedTo;
        String from = twilioWhatsAppFrom.startsWith("whatsapp:") ? twilioWhatsAppFrom : ("whatsapp:" + normalizePhone(twilioWhatsAppFrom));

        return sendTwilioMessage(to, from, body);
    }

    private ChannelDeliveryResult sendTwilioMessage(String to, String from, String body) {
        try {
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json";

            String formBody = "To=" + encode(to)
                    + "&From=" + encode(from)
                    + "&Body=" + encode(body);

            String authHeader = "Basic " + Base64.getEncoder()
                    .encodeToString((twilioAccountSid + ":" + twilioAuthToken).getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", authHeader)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                String sid = extractSid(response.body());
                return ChannelDeliveryResult.delivered(sid);
            }

            return ChannelDeliveryResult.failed("Gateway response status " + response.statusCode());
        } catch (Exception ex) {
            return ChannelDeliveryResult.failed(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        }
    }

    private boolean hasTwilioCredentials() {
        return !twilioAccountSid.isBlank() && !twilioAuthToken.isBlank();
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }

        String digitsAndPlus = phone.trim().replaceAll("[^0-9+]", "");
        if (digitsAndPlus.isBlank()) {
            return null;
        }

        if (digitsAndPlus.startsWith("+")) {
            return digitsAndPlus;
        }

        String country = (defaultCountryCode == null || defaultCountryCode.isBlank()) ? "+91" : defaultCountryCode.trim();
        if (!country.startsWith("+")) {
            country = "+" + country;
        }

        return country + digitsAndPlus;
    }

    private String extractSid(String body) {
        if (body == null) {
            return null;
        }

        String marker = "\"sid\":\"";
        int index = body.indexOf(marker);
        if (index < 0) {
            return null;
        }

        int start = index + marker.length();
        int end = body.indexOf('"', start);
        if (end <= start) {
            return null;
        }

        return body.substring(start, end);
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
