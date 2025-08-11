FROM maven:3.9.6-eclipse-temurin-17-alpine AS build

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline

COPY src ./src

# Build dell'applicazione
RUN mvn clean package -DskipTests

# Stage 2: Runtime dell'applicazione
FROM openjdk:17-jdk-alpine

# Crea un utente non-root per sicurezza
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

# Copia il JAR dall'immagine di build
COPY --from=build /app/target/*.jar app.jar

# Espone la porta dell'applicazione Spring Boot
EXPOSE 8080

# Variabili d'ambiente per la configurazione
ENV SPRING_PROFILES_ACTIVE=docker

# Comando di avvio dell'applicazione
ENTRYPOINT ["java", "-jar", "/app.jar"]