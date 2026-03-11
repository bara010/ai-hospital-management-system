package com.hospital.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pharmacy_items")
public class PharmacyItem {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_gen")
    @SequenceGenerator(name = "seq_gen", sequenceName = "pharmacy_item_seq", allocationSize = 1)
    private Long id;

    private String name;
    private String category;   // Antibiotic, Painkiller, Cardiovascular, etc.
    private String supplier;
    private int stock;
    private int minStock;      // Reorder threshold
    private double unitPrice;
    private String unit;       // tablets, vials, strips, etc.
    private LocalDate expiryDate;

    // LOW, CRITICAL, OK
    private String stockStatus = "OK";

    @Column(name = "last_restocked")
    private LocalDateTime lastRestocked = LocalDateTime.now();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public PharmacyItem() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String n) { this.name = n; }
    public String getCategory() { return category; }
    public void setCategory(String c) { this.category = c; }
    public String getSupplier() { return supplier; }
    public void setSupplier(String s) { this.supplier = s; }
    public int getStock() { return stock; }
    public void setStock(int s) { this.stock = s; }
    public int getMinStock() { return minStock; }
    public void setMinStock(int m) { this.minStock = m; }
    public double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(double p) { this.unitPrice = p; }
    public String getUnit() { return unit; }
    public void setUnit(String u) { this.unit = u; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate e) { this.expiryDate = e; }
    public String getStockStatus() { return stockStatus; }
    public void setStockStatus(String s) { this.stockStatus = s; }
    public LocalDateTime getLastRestocked() { return lastRestocked; }
    public void setLastRestocked(LocalDateTime l) { this.lastRestocked = l; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
