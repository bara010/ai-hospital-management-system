package com.hospito.repository;

import com.hospito.entity.ReminderChannel;
import com.hospito.entity.ReminderDispatch;
import com.hospito.entity.ReminderStage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReminderDispatchRepository extends JpaRepository<ReminderDispatch, Long> {

    boolean existsByAppointmentIdAndRecipientIdAndStageAndChannel(
            Long appointmentId,
            Long recipientId,
            ReminderStage stage,
            ReminderChannel channel
    );
}
