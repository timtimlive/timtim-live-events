# TimTim.Live events for Android (Kotlin)

> **Developer Preview.** Full guide, troubleshooting and test plan: [mobile/README.md](../README.md).

1. Copy `src/main/kotlin/live/timtim/events` into your app; add `implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")` and the `org.jetbrains.kotlin.plugin.serialization` plugin; add the `INTERNET` permission.
2. Search, off the main thread:

   ```kotlin
   val timtim = TimTimEvents()                      // no key: sample events
   val page = withContext(Dispatchers.IO) { timtim.events(EventQuery(city = "Miami", category = "music")) }
   ```
3. Open tickets exactly as given: `event.ticketUrl?.let { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(it))) }`

A server key (`tt_sk_live_…`) is refused — anyone can read an app's files. Java 17 bytecode (AGP 8+). Tests: `gradle build`.
