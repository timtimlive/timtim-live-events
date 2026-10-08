# TimTimEvents for iOS (Swift)

> **Developer Preview.** Full guide, troubleshooting and test plan: [mobile/README.md](../README.md).

1. Xcode → **File → Add Package Dependencies… → Add Local…** → choose this `mobile/ios` folder.
2. Search:

   ```swift
   import TimTimEvents

   let timtim = try TimTimEvents()                  // no key: sample events
   let page = try await timtim.events(EventQuery(city: "Miami", category: "music"))
   ```
3. Open tickets exactly as given: `if let url = event.ticketURL { await UIApplication.shared.open(url) }`

A server key (`tt_sk_live_…`) is refused — anyone can read an app's files. iOS 15+, macOS 12+, Swift 5.9+. Tests: `swift test`.
