import Foundation

// The shapes of the TimTim.Live API, field for field from the contract
// (openapi.yaml, components.schemas.Event / Category / Location / Problem).
// scripts/check-mobile-models.mjs fails CI if a field here and the contract
// drift apart. Decoded with .convertFromSnakeCase, so `buy_url` is `buyUrl`.

/// An event status. v1 only grows: a status this version does not know decodes as `.unknown`, never as an error.
public enum EventStatus: String, Codable, Sendable {
    case scheduled, postponed, rescheduled, cancelled, completed
    case soldOut = "sold_out"
    case unknown

    public init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = EventStatus(rawValue: raw) ?? .unknown
    }
}

/// How easy it is to get a ticket right now.
public enum TicketAvailability: String, Codable, Sendable {
    case available, limited, ended
    case soldOut = "sold_out"
    case notOnSale = "not_on_sale"
    case unknown

    public init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = TicketAvailability(rawValue: raw) ?? .unknown
    }
}

public struct Event: Codable, Sendable, Identifiable, Equatable {
    public let id: String
    public let name: String
    public let status: EventStatus
    public let startsAt: String?
    public let endsAt: String?
    /// The day as the venue calls it, YYYY-MM-DD.
    public let date: String
    public let timezone: String?
    public let location: Location
    public let image: String?
    public let category: String?
    public let performers: [Performer]
    public let tickets: Tickets
    public let earn: Earn
    public let canShare: Bool
    /// The event's public TimTim.Live page.
    public let url: String
    public let display: Display
    public let organizer: Organizer
    /// True for sandbox events.
    public let test: Bool
    public let updatedAt: String
    public let inventoryUpdatedAt: String?

    public struct Location: Codable, Sendable, Equatable {
        public let venue: String?
        public let address: String?
        public let city: String?
        public let country: String?
        public let lat: Double?
        public let lng: Double?
    }

    public struct Performer: Codable, Sendable, Equatable {
        public let name: String
    }

    public struct Tickets: Codable, Sendable, Equatable {
        public let from: Double?
        public let to: Double?
        public let currency: String?
        public let availability: TicketAvailability?
        /// Open this exactly as given — it carries your partner credit.
        public let buyUrl: String?
    }

    public struct Earn: Codable, Sendable, Equatable {
        public let eligible: Bool
        public let amount: Double?
        public let percent: Double?
        public let currency: String?
        public let description: String?
    }

    public struct Display: Codable, Sendable, Equatable {
        public let shortDescription: String?
        public let dateLabel: String?
        public let priceLabel: String?
    }

    public struct Organizer: Codable, Sendable, Equatable {
        public let name: String?
        public let verified: Bool?
    }

    /// The ticket link, only when it is https and tickets can still be bought.
    public var ticketURL: URL? {
        guard let raw = tickets.buyUrl, let url = URL(string: raw), url.scheme == "https" else { return nil }
        if [.cancelled, .soldOut, .completed].contains(status) { return nil }
        if let a = tickets.availability, [.soldOut, .ended, .notOnSale].contains(a) { return nil }
        return url
    }

    /// The picture, only when it is https.
    public var imageURL: URL? {
        guard let raw = image, let url = URL(string: raw), url.scheme == "https" else { return nil }
        return url
    }
}

public struct EventList: Codable, Sendable {
    /// "test" for sample events (a test key, or no key), "live" otherwise.
    public let mode: String
    public let events: [Event]
    /// Pass this as `cursor` to get the next page; nil on the last page.
    public let next: String?
    public let notices: [String]?
}

public struct EventResponse: Codable, Sendable {
    public let mode: String
    public let event: Event
}

public struct Category: Codable, Sendable, Equatable {
    public let id: String
    public let events: Int
}

public struct CategoryList: Codable, Sendable {
    public let mode: String
    public let categories: [Category]
}

public struct Place: Codable, Sendable, Equatable {
    public let city: String
    public let country: String?
    public let events: Int
}

public struct LocationList: Codable, Sendable {
    public let mode: String
    public let locations: [Place]
}

/// A problem, in plain words (RFC 9457).
public struct Problem: Codable, Sendable {
    public let type: String?
    public let title: String
    public let status: Int
    public let detail: String
    public let requestId: String?
    public let code: String?
}
