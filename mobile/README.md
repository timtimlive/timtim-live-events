# TimTim.Live events in mobile apps

> **Developer Preview.** Three ways in, all talking to the same API and showing the same events, ids and ticket links as every website.

| Platform | What | Where |
|---|---|---|
| React Native / Expo | `<TimTimEventList />` and `useTimTimEvents()` | [`packages/react-native`](../packages/react-native) |
| iOS (Swift) | `TimTimEvents` — async/await client and `Codable` models | [`mobile/ios`](./ios) |
| Android (Kotlin) | `TimTimEvents` — client and `@Serializable` models | [`mobile/android`](./android) |

The Swift and Kotlin models are checked against the API contract on every change (`npm run check:mobile`). If the API gets a field a model lacks, the check fails.

**Keys in apps.** Anyone can read an app's files, so a server key (`tt_sk_live_…`) is refused by all three. Use a website key (`tt_pk_live_…`) or test key — or no key for sample events. To use a server key, call TimTim.Live from your own server and give your app the result.

**Ticket links.** Open `tickets.buy_url` exactly as given (in the system browser or an in-app browser). It carries your partner credit.

## iOS — 3 steps

1. In Xcode: **File → Add Package Dependencies… → Add Local…** and choose `mobile/ios` from this repository. (A separate SwiftPM URL is coming; SwiftPM needs `Package.swift` at a repository's root.)
2. Search:

   ```swift
   import TimTimEvents

   let timtim = try TimTimEvents()                  // no key: sample events
   let page = try await timtim.events(EventQuery(city: "Miami", category: "music"))
   for event in page.events { print(event.name, event.ticketURL as Any) }
   ```
3. Open tickets: `if let url = event.ticketURL { await UIApplication.shared.open(url) }`

## Android — 3 steps

1. Copy `mobile/android/src/main/kotlin/live/timtim/events` into your app, and add `implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")` plus the `org.jetbrains.kotlin.plugin.serialization` plugin. (A Maven package is coming.)
2. Search — off the main thread:

   ```kotlin
   val timtim = TimTimEvents()                      // no key: sample events
   val page = withContext(Dispatchers.IO) { timtim.events(EventQuery(city = "Miami", category = "music")) }
   page.events.forEach { println("${it.name} ${it.ticketUrl}") }
   ```
3. Open tickets: `event.ticketUrl?.let { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(it))) }`

Add `<uses-permission android:name="android.permission.INTERNET" />` to your manifest.

## What each client can do

| | React Native | Swift | Kotlin |
|---|---|---|---|
| Search events (city, country, category, dates, artist, near a point) | ✓ | ✓ | ✓ |
| One event by id (needs a key) | ✓ (`@timtim-live/events`) | `event(id:)` | `event(id)` |
| Categories and cities with counts | ✓ | ✓ | ✓ |
| Count views and taps (`track`) | automatic | `track(_:)` | `track(...)` |
| Readable problems with `Retry-After` | ✓ | `TimTimError.api` | `TimTimException.Api` |

## Troubleshooting

- **Every event says TEST EVENT** — no key, so these are samples. Add your website or test key.
- **"Never put a server key in an app"** — use a website key (`tt_pk_live_…`).
- **Android `NetworkOnMainThreadException`** — call from `Dispatchers.IO`.
- **iOS "App Transport Security"** — not needed; everything is https.

## Test plan

- Swift: `cd mobile/ios && swift test` (CI: macOS).
- Kotlin: `cd mobile/android && gradle build` (CI: Linux, Java 17).
- Both decode real answers captured from the API. They also check keyless and keyed paths, the server-key refusal, problems with `Retry-After`, an unknown status, and `track`.
- React Native: `npm test` (runs with the rest of the JavaScript packages).

Compatibility: iOS 15+, macOS 12+ (Swift 5.9+). Android: Java 17 bytecode (AGP 8+). React Native 0.72+ / Expo SDK 49+.
