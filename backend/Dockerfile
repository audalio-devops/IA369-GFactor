# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Nota: não usar `mvn dependency:go-offline` aqui para "cachear" dependências
# num layer separado — ele resolve as dependências de TODOS os goals dos
# plugins do pom (incluindo o AWS SDK que o spring-boot-maven-plugin só usa
# para o goal build-image/buildpacks, nunca invocado neste Dockerfile), o
# que baixa dezenas de MB inúteis e deixa o build bem mais lento.
COPY pom.xml .
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---- Run stage ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8369
ENTRYPOINT ["java", "-jar", "app.jar"]
