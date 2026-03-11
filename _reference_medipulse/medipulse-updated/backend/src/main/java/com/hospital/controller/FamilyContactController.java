package com.hospital.controller;
import com.hospital.model.FamilyContact;
import com.hospital.repository.FamilyContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/family") @CrossOrigin(origins="http://localhost:3000")
public class FamilyContactController {
    @Autowired private FamilyContactRepository repo;

    @GetMapping("/patient/{id}") public List<FamilyContact> get(@PathVariable Long id) {
        return repo.findByPatientIdOrderByPrimaryDescIdAsc(id);
    }
    @PostMapping public ResponseEntity<?> add(@RequestBody Map<String,Object> b) {
        try {
            FamilyContact c=new FamilyContact();
            c.setPatientId(Long.parseLong(b.get("patientId").toString()));
            c.setName((String)b.get("name"));
            c.setRelation((String)b.getOrDefault("relation","Family"));
            c.setPhone((String)b.getOrDefault("phone",""));
            c.setEmail((String)b.getOrDefault("email",""));
            c.setAvatar((String)b.getOrDefault("avatar","👤"));
            c.setPrimary(Boolean.parseBoolean(b.getOrDefault("primary","false").toString()));
            if(b.containsKey("alertTypes")) c.setAlertTypes(b.get("alertTypes").toString());
            return ResponseEntity.ok(repo.save(c));
        } catch(Exception e){return ResponseEntity.badRequest().body(Map.of("error",e.getMessage()));}
    }
    @PutMapping("/{id}") public ResponseEntity<?> update(@PathVariable Long id,@RequestBody Map<String,Object> b) {
        return repo.findById(id).map(c->{
            if(b.containsKey("name")) c.setName((String)b.get("name"));
            if(b.containsKey("phone")) c.setPhone((String)b.get("phone"));
            if(b.containsKey("email")) c.setEmail((String)b.get("email"));
            if(b.containsKey("relation")) c.setRelation((String)b.get("relation"));
            if(b.containsKey("status")) c.setStatus((String)b.get("status"));
            if(b.containsKey("alertTypes")) c.setAlertTypes(b.get("alertTypes").toString());
            return ResponseEntity.ok(repo.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}") public ResponseEntity<?> delete(@PathVariable Long id) {
        if(!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.ok(Map.of("success",true));
    }
}
