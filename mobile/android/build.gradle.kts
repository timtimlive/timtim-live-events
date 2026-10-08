// TimTim.Live events — a Kotlin client for Android and the JVM (Developer Preview).
// Docs: https://timtim.live/developers · Contract: https://timtim.live/partner-api/openapi.yaml
plugins {
    kotlin("jvm") version "2.2.0"
    kotlin("plugin.serialization") version "2.2.0"
    `java-library`
}

group = "live.timtim"
version = "0.1.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")
    testImplementation(kotlin("test"))
}

kotlin {
    // Java 17 bytecode runs on Android (AGP 8+) and every current JVM.
    jvmToolchain(17)
    explicitApi()
}

tasks.test {
    useJUnitPlatform()
}
