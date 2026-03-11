package com.hospital.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
public class Invoice {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_gen")
    @SequenceGenerator(name = "seq_gen", sequenceName = "invoice_seq", allocationSize = 1)
    private Long id;

    private String invoiceNumber;
    private String patientName;
    private String patientIdCode;  // e.g. PT-1001
    private String doctorName;

    // JSON array of line items stored as TEXT
    @Column(columnDefinition = "TEXT")
    private String itemsJson;

    private double subtotal;
    private double tax;
    private double total;

    // PAID, PENDING, OVERDUE
    private String status = "PENDING";

    @Column(name = "invoice_date")
    private LocalDateTime invoiceDate = LocalDateTime.now();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Invoice() {}

    public Long getId() { return id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String i) { this.invoiceNumber = i; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String p) { this.patientName = p; }
    public String getPatientIdCode() { return patientIdCode; }
    public void setPatientIdCode(String p) { this.patientIdCode = p; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String d) { this.doctorName = d; }
    public String getItemsJson() { return itemsJson; }
    public void setItemsJson(String j) { this.itemsJson = j; }
    public double getSubtotal() { return subtotal; }
    public void setSubtotal(double s) { this.subtotal = s; }
    public double getTax() { return tax; }
    public void setTax(double t) { this.tax = t; }
    public double getTotal() { return total; }
    public void setTotal(double t) { this.total = t; }
    public String getStatus() { return status; }
    public void setStatus(String s) { this.status = s; }
    public LocalDateTime getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDateTime d) { this.invoiceDate = d; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
