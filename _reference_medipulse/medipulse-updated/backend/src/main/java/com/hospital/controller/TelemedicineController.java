package com.hospital.controller;
import com.hospital.model.TelemedicineSession;
import com.hospital.repository.TelemedicineSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/telemedicine") @CrossOrigin(origins="http://localhost:3000")
public class TelemedicineController {
    @Autowired private TelemedicineSessionRepository repo;

    @GetMapping("/patient/{id}") public Map<String,Object> getByPatient(@PathVariable Long id) {
        List<TelemedicineSession> all=repo.findByPatientIdOrderByCreatedAtDesc(id);
        return Map.of(
            "upcoming", all.stream().filter(s->List.of("scheduled","ready").contains(s.getStatus())).toList(),
            "past",     all.stream().filter(s->List.of("completed","cancelled").contains(s.getStatus())).toList()
        );
    }
    @GetMapping("/all") public List<TelemedicineSession> getAll(){return repo.findAllByOrderByCreatedAtDesc();}

    @PostMapping public ResponseEntity<?> book(@RequestBody Map<String,Object> b) {
        try {
            TelemedicineSession s=new TelemedicineSession();
            s.setPatientId(Long.parseLong(b.get("patientId").toString()));
            s.setPatientName((String)b.getOrDefault("patientName",""));
            s.setDoctorName((String)b.getOrDefault("doctorName",""));
            s.setSpecialty((String)b.getOrDefault("specialty","General"));
            s.setDoctorIcon((String)b.getOrDefault("doctorIcon","👨‍⚕️"));
            s.setSessionDate((String)b.getOrDefault("sessionDate",""));
            s.setSessionTime((String)b.getOrDefault("sessionTime",""));
            s.setDuration((String)b.getOrDefault("duration","20 min"));
            s.setType((String)b.getOrDefault("type","Consultation"));
            s.setStatus("scheduled");
            s.setRoomId("MPX-"+(1000+new Random().nextInt(8999)));
            TelemedicineSession saved=repo.save(s);
            return ResponseEntity.ok(Map.of("success",true,"id",saved.getId(),"roomId",saved.getRoomId()));
        } catch(Exception e){return ResponseEntity.badRequest().body(Map.of("error",e.getMessage()));}
    }
    @PutMapping("/{id}/complete") public ResponseEntity<?> complete(@PathVariable Long id,@RequestBody Map<String,Object> b) {
        return repo.findById(id).map(s->{
            s.setStatus("completed");
            if(b.containsKey("durationMinutes")) s.setDurationMinutes(Integer.parseInt(b.get("durationMinutes").toString()));
            if(b.containsKey("notes")) s.setNotes((String)b.get("notes"));
            return ResponseEntity.ok(repo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }
    @PutMapping("/{id}/cancel") public ResponseEntity<?> cancel(@PathVariable Long id) {
        return repo.findById(id).map(s->{s.setStatus("cancelled");return ResponseEntity.ok(repo.save(s));})
            .orElse(ResponseEntity.notFound().build());
    }
}
