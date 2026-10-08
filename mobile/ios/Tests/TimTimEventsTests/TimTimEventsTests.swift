import XCTest
@testable import TimTimEvents
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

/// Answers every request from a closure, and remembers what was asked.
final class StubProtocol: URLProtocol {
    static var respond: (URLRequest) -> (Int, [String: String], Data) = { _ in (200, [:], Data()) }
    static var seen: [URLRequest] = []

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        StubProtocol.seen.append(request)
        let (status, headers, body) = StubProtocol.respond(request)
        let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers)!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: body)
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}

final class TimTimEventsTests: XCTestCase {
    var session: URLSession!

    override func setUp() {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [StubProtocol.self]
        session = URLSession(configuration: config)
        StubProtocol.seen = []
    }

    func fixture(_ name: String) throws -> Data {
        let url = try XCTUnwrap(Bundle.module.url(forResource: name, withExtension: nil, subdirectory: "Fixtures"))
        return try Data(contentsOf: url)
    }

    func testDecodesARealCapturedAnswer() throws {
        let list = try TimTimEvents.decoder.decode(EventList.self, from: fixture("city-miami-category-music.200.json"))
        XCTAssertEqual(list.mode, "test")
        let event = try XCTUnwrap(list.events.first)
        XCTAssertEqual(event.id, "evt_test_miami_konpa")
        XCTAssertEqual(event.location.city, "Miami")
        XCTAssertTrue(event.test)
        XCTAssertNotNil(event.tickets.buyUrl)
    }

    func testACancelledEventHasNoTicketLink() throws {
        let list = try TimTimEvents.decoder.decode(EventList.self, from: fixture("simulate-cancelled.200.json"))
        let event = try XCTUnwrap(list.events.first)
        XCTAssertEqual(event.status, .cancelled)
        XCTAssertNil(event.ticketURL)
    }

    func testAnUnknownStatusIsNotAnError() throws {
        let json = #"{"mode":"live","events":[],"next":null}"#
        XCTAssertNoThrow(try TimTimEvents.decoder.decode(EventList.self, from: Data(json.utf8)))
        let status = try JSONDecoder().decode([EventStatus].self, from: Data(#"["on_the_moon"]"#.utf8))
        XCTAssertEqual(status, [.unknown])
    }

    func testNoKeyReadsSampleEventsWithoutAnAuthorizationHeader() async throws {
        let body = try fixture("city-miami-category-music.200.json")
        StubProtocol.respond = { _ in (200, ["Content-Type": "application/json"], body) }
        let timtim = try TimTimEvents(session: session)
        let page = try await timtim.events(EventQuery(city: "Miami", country: "us", category: "Music", limit: 500))
        XCTAssertEqual(page.events.count, 1)
        let request = try XCTUnwrap(StubProtocol.seen.first)
        let url = try XCTUnwrap(request.url)
        XCTAssertEqual(url.path, "/v1/demo/events")
        let items = Dictionary(uniqueKeysWithValues: (URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []).map { ($0.name, $0.value ?? "") })
        XCTAssertEqual(items, ["city": "Miami", "country": "US", "category": "music", "limit": "100"])
        XCTAssertNil(request.value(forHTTPHeaderField: "Authorization"))
    }

    func testAKeyUsesEventsWithABearerHeader() async throws {
        let body = try fixture("city-miami-category-music.200.json")
        StubProtocol.respond = { _ in (200, [:], body) }
        let timtim = try TimTimEvents(apiKey: "tt_test_example_key", session: session)
        _ = try await timtim.events(EventQuery(latitude: 38.9, longitude: -77, radiusKm: 20))
        let request = try XCTUnwrap(StubProtocol.seen.first)
        XCTAssertEqual(request.url?.path, "/v1/events")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer tt_test_example_key")
    }

    func testAServerKeyIsRefusedInAnApp() {
        XCTAssertThrowsError(try TimTimEvents(apiKey: "tt_sk_live_abc")) { XCTAssertEqual($0 as? TimTimError, .serverKeyInApp) }
    }

    func testAProblemComesBackInPlainWordsWithRetryAfter() async throws {
        let body = try fixture("simulate-rate_limited.429.json")
        StubProtocol.respond = { _ in (429, ["Retry-After": "30"], body) }
        let timtim = try TimTimEvents(session: session)
        do {
            _ = try await timtim.events()
            XCTFail("expected a problem")
        } catch let TimTimError.api(status, code, title, _, _, retryAfter) {
            XCTAssertEqual(status, 429)
            XCTAssertEqual(code, "rate_limited")
            XCTAssertFalse(title.isEmpty)
            XCTAssertEqual(retryAfter, 30)
        }
    }

    func testTrackSendsAPublicKeyAndNeverThrows() async throws {
        StubProtocol.respond = { _ in (204, [:], Data()) }
        let timtim = try TimTimEvents(apiKey: "tt_pk_live_example_key", session: session)
        let ok = await timtim.track(.eventClick, eventId: "evt_1", view: "pv_12345678")
        XCTAssertTrue(ok)
        let request = try XCTUnwrap(StubProtocol.seen.first)
        XCTAssertEqual(request.url?.path, "/v1/track")
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "text/plain")
    }
}
