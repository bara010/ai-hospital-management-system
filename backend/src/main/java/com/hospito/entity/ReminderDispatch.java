package com.hospito.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "reminder_dispatches",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_reminder_dispatch_unique",
                        columnNames = {"appointment_id", "recipient_id", "stage", "channel"}
                )
        }
)
public class ReminderDispatch extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "reminder_dispatches_seq_gen")
    @SequenceGenerator(name = "reminder_dispatches_seq_gen", sequenceName = "reminder_dispatches_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReminderStage stage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReminderChannel channel;

    @Column(nullable = false)
    private boolean delivered;

    @Column(name = "provider_message_id", length = 200)
    private String providerMessageId;

    @Column(name = "failure_reason", length = 1000)
    private String failureReason;

    public Long getId() {
        return id;
    }

    public Appointment getAppointment() {
        return appointment;
    }

    public void setAppointment(Appointment appointment) {
        this.appointment = appointment;
    }

    public User getRecipient() {
        return recipient;
    }

    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }

    public ReminderStage getStage() {
        return stage;
    }

    public void setStage(ReminderStage stage) {
        this.stage = stage;
    }

    public ReminderChannel getChannel() {
        return channel;
    }

    public void setChannel(ReminderChannel channel) {
        this.channel = channel;
    }

    public boolean isDelivered() {
        return delivered;
    }

    public void setDelivered(boolean delivered) {
        this.delivered = delivered;
    }

    public String getProviderMessageId() {
        return providerMessageId;
    }

    public void setProviderMessageId(String providerMessageId) {
        this.providerMessageId = providerMessageId;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }
}
