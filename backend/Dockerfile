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
# Debian-based (not -alpine): eclipse-temurin's alpine JRE tags are amd64-only,
# which breaks on arm64 hosts (e.g. Oracle Ampere A1 OCI instances) with
# "no match for platform in manifest". The debian-based tag is multi-arch.
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8369
ENTRYPOINT ["java", "-jar", "app.jar"]
