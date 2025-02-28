package com.tesi.presenzepro.config;

import com.fasterxml.jackson.databind.module.SimpleModule;
import com.tesi.presenzepro.calendar.Calendar;
import com.tesi.presenzepro.calendar.CalendarEntry;
import com.tesi.presenzepro.calendar.CalendarDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class AppConfig {
    @Bean
    public ResourceBundleMessageSource messageSource(){
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("messages.label");
        source.setDefaultEncoding("UTF-8");
        return source;
    }

    //Settings per Gmail SMTP
    @Bean
    public JavaMailSender getJavaMailSender(){
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);

        mailSender.setUsername("samuimpact1@gmail.com");
        mailSender.setPassword("raux ctty xjqn mqop");

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "true");

        return mailSender;
    }

    @Bean
    public SimpleModule calendarModule() {
        SimpleModule module = new SimpleModule();
        module.addDeserializer(Calendar.class, new CalendarDeserializer());
        return module;
    }
}
