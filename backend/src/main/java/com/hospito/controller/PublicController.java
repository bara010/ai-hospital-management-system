package com.hospito.controller;

import com.hospito.dto.AppointmentSlotResponse;
import com.hospito.dto.DoctorCardResponse;
import com.hospito.dto.DoctorRatingResponse;
import com.hospito.service.AppointmentService;
import com.hospito.service.DoctorService;
import com.hospito.service.RatingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final DoctorService doctorService;
    private final RatingService ratingService;
    private final AppointmentService appointmentService;

    public PublicController(
            DoctorService doctorService,
            RatingService ratingService,
            AppointmentService appointmentService
    ) {
        this.doctorService = doctorService;
        this.ratingService = ratingService;
        this.appointmentService = appointmentService;
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorCardResponse>> doctors(@RequestParam(required = false) String specialization) {
        return ResponseEntity.ok(doctorService.listApprovedDoctors(specialization));
    }

    @GetMapping("/doctors/{doctorId}/ratings")
    public ResponseEntity<List<DoctorRatingResponse>> doctorRatings(@PathVariable Long doctorId) {
        return ResponseEntity.ok(ratingService.listRatingsForDoctor(doctorId));
    }

    @GetMapping("/doctors/{doctorId}/available-slots")
    public ResponseEntity<List<AppointmentSlotResponse>> availableSlots(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(appointmentService.getAvailableSlots(doctorId, date));
    }
}
