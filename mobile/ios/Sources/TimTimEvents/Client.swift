import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

/// Something went wrong. `.api` carries TimTim.Live's own explanation.
public enum TimTimError: Error, Equatable, CustomStringConvertible {
    /// A server key (tt_sk_live_…) or access token in an app: anyone can read an app's files, so it is refused.
    case serverKeyInApp
    /// The base URL is not https. Plain http is allowed only for local testing (localhost, 127.0.0.1, 10.0.2.2).
    case insecureBaseURL(String)
    case keyRequired(String)
    case api(status: Int, code: String?, title: String, detail: String, requestId: String?, retryAfter: Int?)
    case invalidResponse(Int)
    case network(String)

    public var description: String {
        switch self {
        case .serverKeyInApp: return "Never put a server key (tt_sk_live_…) in an app. Use a website key (tt_pk_live_…) or call TimTim.Live from your own server."
        case .insecureBaseURL(let url): return "The base URL must start with https:// (plain http only for localhost, 127.0.0.1 or 10.0.2.2 while testing). Got: \(url)"
        case .keyRequired(let what): return "\(what) needs a key. Get a free test key at https://timtim.live/partners/dashboard."
        case let .api(status, _, title, detail, requestId, _): return "\(status) \(title) \(detail)" + (requestId.map { " (request \($0))" } ?? "")
        case .invalidResponse(let status): return "TimTim.Live answered \(status) but not with JSON."
        case .network(let message): return "Could not reach TimTim.Live: \(message)"
        }
    }
}

/// What to search for. Every field is optional; leave all empty for upcoming events, soonest first.
public struct EventQuery: Sendable, Equatable {
    public var city: String?
    public var country: String?
    public var category: String?
    public var from: String?
    public var to: String?
    public var artist: String?
    public var latitude: Double?
    public var longitude: Double?
    public var radiusKm: Double?
    public var limit: Int?
    public var cursor: String?

    public init(city: String? = nil, country: String? = nil, category: String? = nil, from: String? = nil, to: String? = nil,
                artist: String? = nil, latitude: Double? = nil, longitude: Double? = nil, radiusKm: Double? = nil, limit: Int? = nil, cursor: String? = nil) {
        self.city = city; self.country = country; self.category = category; self.from = from; self.to = to; self.artist = artist
        self.latitude = latitude; self.longitude = longitude; self.radiusKm = radiusKm; self.limit = limit; self.cursor = cursor
    }

    var items: [URLQueryItem] {
        var q: [URLQueryItem] = []
        func add(_ name: String, _ value: String?) { if let v = value, !v.isEmpty { q.append(URLQueryItem(name: name, value: v)) } }
        add("city", city); add("country", country?.uppercased()); add("category", category?.lowercased())
        add("from", from); add("to", to); add("artist", artist)
        add("lat", latitude.map { String($0) }); add("lng", longitude.map { String($0) }); add("radius", radiusKm.map { String($0) })
        add("limit", limit.map { String(min(max($0, 1), 100)) }); add("cursor", cursor)
        return q
    }
}

/// The TimTim.Live events API.
///
///     let timtim = try TimTimEvents()                       // sample events, no key
///     let page = try await timtim.events(EventQuery(city: "Miami"))
///
/// With no key every answer is sample data (`mode == "test"`).
public struct TimTimEvents: Sendable {
    public static let defaultBaseURL = URL(string: "https://api.timtim.live/v1")!
    public static let version = "0.1.0"

    public let apiKey: String?
    public let baseURL: URL
    private let session: URLSession

    public init(apiKey: String? = nil, baseURL: URL = TimTimEvents.defaultBaseURL, session: URLSession = .shared) throws {
        if let key = apiKey, key.hasPrefix("tt_sk_live_") || key.hasPrefix("tt_at_") { throw TimTimError.serverKeyInApp }
        /* A key travels in every request: never over plain http, except to a server on this machine or the Android emulator's host. */
        guard TimTimEvents.isAllowedBaseURL(baseURL) else { throw TimTimError.insecureBaseURL(baseURL.absoluteString) }
        self.apiKey = (apiKey?.isEmpty ?? true) ? nil : apiKey
        self.baseURL = baseURL
        self.session = session
    }

    /// One page of events. With no key: sample events from /demo/events.
    public func events(_ query: EventQuery = EventQuery()) async throws -> EventList {
        try await get(apiKey == nil ? "demo/events" : "events", query.items)
    }

    /// One event, even after it was cancelled or ended. Needs a key.
    public func event(id: String) async throws -> Event {
        guard apiKey != nil else { throw TimTimError.keyRequired("event(id:)") }
        /* Encoded exactly once, here; get() puts it into the path as it is (no second encoding of the %). */
        let response: EventResponse = try await get("events/\(TimTimEvents.encodePathSegment(id))", [])
        return response.event
    }

    /// Event types with upcoming events, and how many.
    public func categories(country: String? = nil) async throws -> CategoryList {
        try await get(apiKey == nil ? "demo/categories" : "categories", country.map { [URLQueryItem(name: "country", value: $0.uppercased())] } ?? [])
    }

    /// Cities with upcoming events, and how many.
    public func locations(country: String? = nil, limit: Int? = nil) async throws -> LocationList {
        var q: [URLQueryItem] = []
        if let c = country { q.append(URLQueryItem(name: "country", value: c.uppercased())) }
        if let l = limit { q.append(URLQueryItem(name: "limit", value: String(min(max(l, 1), 500)))) }
        return try await get(apiKey == nil ? "demo/locations" : "locations", q)
    }

    public enum Signal: String, Sendable { case impression, eventView = "event_view", eventClick = "event_click" }

    /// Tell TimTim.Live what was shown or tapped, so your dashboard can count it. Never money.
    /// Never throws; true when TimTim.Live answered 204.
    @discardableResult
    public func track(_ signal: Signal, eventId: String? = nil, shown: Int? = nil, view: String? = nil) async -> Bool {
        var body: [String: Any] = ["type": signal.rawValue]
        if let eventId { body["event_id"] = eventId }
        if let shown { body["shown"] = shown }
        if let view { body["view"] = view }
        if let key = apiKey, key.hasPrefix("tt_pk_live_") || key.hasPrefix("tt_test_") { body["key"] = key }
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return false }
        var request = URLRequest(url: baseURL.appendingPathComponent("track"))
        request.httpMethod = "POST"
        request.setValue("text/plain", forHTTPHeaderField: "Content-Type")
        request.httpBody = data
        guard let (_, response) = try? await session.data(for: request) else { return false }
        return (response as? HTTPURLResponse)?.statusCode == 204
    }

    // MARK: plumbing

    /// A fresh decoder each time: JSONDecoder is not Sendable, so none is shared between tasks.
    static var decoder: JSONDecoder {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        return d
    }

    static let localHosts: Set<String> = ["localhost", "127.0.0.1", "10.0.2.2"]

    /// https anywhere; plain http only to localhost, 127.0.0.1 or 10.0.2.2 (the Android emulator's name for this computer).
    static func isAllowedBaseURL(_ url: URL) -> Bool {
        guard let scheme = url.scheme?.lowercased(), let host = url.host?.lowercased(), !host.isEmpty else { return false }
        return scheme == "https" || (scheme == "http" && localHosts.contains(host))
    }

    /// RFC 3986 unreserved letters stay; everything else (including "/", "%", "." and non-ASCII) becomes %XX of its UTF-8 bytes.
    static func encodePathSegment(_ value: String) -> String {
        let keep = Set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_~".utf8)
        let hex = Array("0123456789ABCDEF")
        var out = ""
        for byte in value.utf8 {
            if keep.contains(byte) {
                out.append(Character(Unicode.Scalar(byte)))
            } else {
                out.append("%"); out.append(hex[Int(byte >> 4)]); out.append(hex[Int(byte & 0x0F)])
            }
        }
        return out
    }

    /// Retry-After is either seconds ("30") or an HTTP-date ("Wed, 21 Oct 2026 07:28:00 GMT"). Whole seconds to wait, never negative.
    static func retryAfterSeconds(_ value: String?, now: Date = Date()) -> Int? {
        guard let raw = value?.trimmingCharacters(in: .whitespaces), !raw.isEmpty else { return nil }
        if let seconds = Int(raw) { return max(0, seconds) }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "GMT")
        formatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss zzz"
        guard let date = formatter.date(from: raw) else { return nil }
        let wait = date.timeIntervalSince(now).rounded(.up)
        return wait <= 0 ? 0 : Int(min(wait, Double(Int32.max)))
    }

    /// `path` is already percent-encoded (see encodePathSegment); it is appended as it is, so nothing is encoded twice.
    private func get<T: Decodable>(_ path: String, _ query: [URLQueryItem]) async throws -> T {
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)!
        var basePath = components.percentEncodedPath
        while basePath.hasSuffix("/") { basePath.removeLast() }
        components.percentEncodedPath = basePath + "/" + path
        if !query.isEmpty { components.queryItems = query }
        var request = URLRequest(url: components.url!)
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("timtim-swift/\(TimTimEvents.version)", forHTTPHeaderField: "User-Agent")
        if let key = apiKey, !path.hasPrefix("demo/") { request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization") }

        let data: Data, response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw TimTimError.network(error.localizedDescription)
        }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            let retry = TimTimEvents.retryAfterSeconds((response as? HTTPURLResponse)?.value(forHTTPHeaderField: "Retry-After"))
            if let p = try? TimTimEvents.decoder.decode(Problem.self, from: data) {
                throw TimTimError.api(status: status, code: p.code, title: p.title, detail: p.detail, requestId: p.requestId, retryAfter: retry)
            }
            throw TimTimError.invalidResponse(status)
        }
        do {
            return try TimTimEvents.decoder.decode(T.self, from: data)
        } catch {
            throw TimTimError.invalidResponse(status)
        }
    }
}
