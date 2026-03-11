package com.hospito;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HospitoApplication {
    public static void main(String[] args) {
        SpringApplication.run(HospitoApplication.class, args);
    }
}
