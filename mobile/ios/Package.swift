// swift-tools-version:5.9
import PackageDescription

// TimTimEvents — a Swift client for the TimTim.Live events API (Developer Preview).
// Docs: https://timtim.live/developers · Contract: https://timtim.live/partner-api/openapi.yaml
let package = Package(
    name: "TimTimEvents",
    platforms: [.iOS(.v15), .macOS(.v12), .tvOS(.v15), .watchOS(.v8)],
    products: [
        .library(name: "TimTimEvents", targets: ["TimTimEvents"]),
    ],
    targets: [
        .target(name: "TimTimEvents"),
        .testTarget(name: "TimTimEventsTests", dependencies: ["TimTimEvents"], resources: [.copy("Fixtures")]),
    ]
)
