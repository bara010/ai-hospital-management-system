package com.hospital.controller;
import com.hospital.model.UserSettings;
import com.hospital.repository.UserSettingsRepository;
import com.hospital.repository.UserRepository;
import com.hospital.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController @RequestMapping("/api/settings") @CrossOrigin(origins="http://localhost:3000")
public class UserSettingsController {
    @Autowired private UserSettingsRepository settingsRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;

    private String email(String auth){return jwtUtil.extractEmail(auth.replace("Bearer ","").trim());}

    @GetMapping public ResponseEntity<?> get(@RequestHeader("Authorization") String auth) {
        return userRepo.findByEmail(email(auth)).map(u->{
            UserSettings s=settingsRepo.findByUserId(u.getId()).orElse(new UserSettings());
            return ResponseEntity.ok(Map.of(
                "name",u.getName(),"email",u.getEmail(),"phone",u.getPhone()!=null?u.getPhone():"","role",u.getRole(),
                "medicineAlerts",s.isMedicineAlerts(),"moodAlerts",s.isMoodAlerts(),
                "appointmentAlerts",s.isAppointmentAlerts(),"labAlerts",s.isLabAlerts(),
                "healthTips",s.isHealthTips(),"language",s.getLanguage()
            ));
        }).orElse(ResponseEntity.status(401).build());
    }

    @PutMapping("/profile") public ResponseEntity<?> profile(@RequestHeader("Authorization") String auth,@RequestBody Map<String,Object> b) {
        return userRepo.findByEmail(email(auth)).map(u->{
            if(b.containsKey("name")&&!b.get("name").toString().isBlank()) u.setName(b.get("name").toString());
            if(b.containsKey("phone")) u.setPhone(b.get("phone").toString());
            userRepo.save(u);
            return ResponseEntity.ok(Map.of("success",true,"name",u.getName(),"phone",u.getPhone()!=null?u.getPhone():""));
        }).orElse(ResponseEntity.status(401).build());
    }

    @PutMapping("/notifications") public ResponseEntity<?> notifs(@RequestHeader("Authorization") String auth,@RequestBody Map<String,Object> b) {
        return userRepo.findByEmail(email(auth)).map(u->{
            UserSettings s=settingsRepo.findByUserId(u.getId()).orElse(new UserSettings());
            s.setUserId(u.getId());
            if(b.containsKey("medicineAlerts")) s.setMedicineAlerts(Boolean.parseBoolean(b.get("medicineAlerts").toString()));
            if(b.containsKey("moodAlerts")) s.setMoodAlerts(Boolean.parseBoolean(b.get("moodAlerts").toString()));
            if(b.containsKey("appointmentAlerts")) s.setAppointmentAlerts(Boolean.parseBoolean(b.get("appointmentAlerts").toString()));
            if(b.containsKey("labAlerts")) s.setLabAlerts(Boolean.parseBoolean(b.get("labAlerts").toString()));
            if(b.containsKey("healthTips")) s.setHealthTips(Boolean.parseBoolean(b.get("healthTips").toString()));
            if(b.containsKey("language")) s.setLanguage(b.get("language").toString());
            s.setUpdatedAt(LocalDateTime.now());
            settingsRepo.save(s);
            return ResponseEntity.ok(Map.of("success",true));
        }).orElse(ResponseEntity.status(401).build());
    }

    @PutMapping("/password") public ResponseEntity<?> password(@RequestHeader("Authorization") String auth,@RequestBody Map<String,String> b) {
        return userRepo.findByEmail(email(auth)).map(u->{
            if(!passwordEncoder.matches(b.get("currentPassword"),u.getPassword()))
                return ResponseEntity.badRequest().body(Map.of("error","Current password is incorrect"));
            u.setPassword(passwordEncoder.encode(b.get("newPassword")));
            userRepo.save(u);
            return ResponseEntity.ok(Map.of("success",true));
        }).orElse(ResponseEntity.status(401).build());
    }
}
