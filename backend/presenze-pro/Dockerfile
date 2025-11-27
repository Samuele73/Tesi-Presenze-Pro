# STAGE 1 — BUILD
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src

# Build dell'applicazione
RUN mvn clean package -DskipTests


# STAGE 2 — RUNTIME
FROM eclipse-temurin:17-jdk-alpine

# Crea un utente non-root per sicurezza
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

WORKDIR /app

# Copia il JAR dalla fase di build
COPY --from=build /app/target/*.jar app.jar

# Espone la porta Spring Boot
EXPOSE 8080

# Imposta profilo attivo
ENV SPRING_PROFILES_ACTIVE=docker

# Avvio dell'applicazione
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
