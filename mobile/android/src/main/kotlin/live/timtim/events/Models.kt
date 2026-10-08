package live.timtim.events

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// The shapes of the TimTim.Live API, field for field from the contract
// (openapi.yaml, components.schemas.Event / Category / Location / Problem).
// scripts/check-mobile-models.mjs fails CI if a field here and the contract
// drift apart. v1 only grows: unknown fields are ignored, unknown status
// values read as UNKNOWN.

public enum class EventStatus { SCHEDULED, POSTPONED, RESCHEDULED, CANCELLED, SOLD_OUT, COMPLETED, UNKNOWN;
    public companion object {
        public fun of(raw: String?): EventStatus = entries.firstOrNull { it.name.equals(raw, ignoreCase = true) } ?: UNKNOWN
    }
}

public enum class TicketAvailability { AVAILABLE, LIMITED, SOLD_OUT, NOT_ON_SALE, ENDED, UNKNOWN;
    public companion object {
        public fun of(raw: String?): TicketAvailability = entries.firstOrNull { it.name.equals(raw, ignoreCase = true) } ?: UNKNOWN
    }
}

@Serializable
public data class Event(
    val id: String,
    val name: String,
    /** Raw status; read [statusKind] for a type-safe value. */
    val status: String,
    @SerialName("starts_at") val startsAt: String? = null,
    @SerialName("ends_at") val endsAt: String? = null,
    /** The day as the venue calls it, YYYY-MM-DD. */
    val date: String,
    val timezone: String? = null,
    val location: Location = Location(),
    val image: String? = null,
    val category: String? = null,
    val performers: List<Performer> = emptyList(),
    val tickets: Tickets = Tickets(),
    val earn: Earn = Earn(),
    @SerialName("can_share") val canShare: Boolean = false,
    /** The event's public TimTim.Live page. */
    val url: String,
    val display: Display = Display(),
    val organizer: Organizer = Organizer(),
    /** True for sandbox events. */
    val test: Boolean = false,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("inventory_updated_at") val inventoryUpdatedAt: String? = null,
) {
    public val statusKind: EventStatus get() = EventStatus.of(status)

    /** The ticket link, only when it is https and tickets can still be bought. Open it exactly as given — it carries your partner credit. */
    public val ticketUrl: String?
        get() {
            val raw = tickets.buyUrl ?: return null
            if (!raw.startsWith("https://")) return null
            if (statusKind in setOf(EventStatus.CANCELLED, EventStatus.SOLD_OUT, EventStatus.COMPLETED)) return null
            if (TicketAvailability.of(tickets.availability) in setOf(TicketAvailability.SOLD_OUT, TicketAvailability.ENDED, TicketAvailability.NOT_ON_SALE)) return null
            return raw
        }

    /** The picture, only when it is https. */
    public val imageUrl: String? get() = image?.takeIf { it.startsWith("https://") }

    @Serializable
    public data class Location(
        val venue: String? = null,
        val address: String? = null,
        val city: String? = null,
        val country: String? = null,
        val lat: Double? = null,
        val lng: Double? = null,
    )

    @Serializable
    public data class Performer(val name: String)

    @Serializable
    public data class Tickets(
        val from: Double? = null,
        val to: Double? = null,
        val currency: String? = null,
        val availability: String? = null,
        @SerialName("buy_url") val buyUrl: String? = null,
    )

    @Serializable
    public data class Earn(
        val eligible: Boolean = false,
        val amount: Double? = null,
        val percent: Double? = null,
        val currency: String? = null,
        val description: String? = null,
    )

    @Serializable
    public data class Display(
        @SerialName("short_description") val shortDescription: String? = null,
        @SerialName("date_label") val dateLabel: String? = null,
        @SerialName("price_label") val priceLabel: String? = null,
    )

    @Serializable
    public data class Organizer(val name: String? = null, val verified: Boolean? = null)
}

@Serializable
public data class EventList(
    /** "test" for sample events (a test key, or no key), "live" otherwise. */
    val mode: String,
    val events: List<Event>,
    /** Pass as [EventQuery.cursor] for the next page; null on the last page. */
    val next: String? = null,
    val notices: List<String> = emptyList(),
)

@Serializable
public data class EventResponse(val mode: String, val event: Event)

@Serializable
public data class Category(val id: String, val events: Int)

@Serializable
public data class CategoryList(val mode: String, val categories: List<Category>)

@Serializable
public data class Place(val city: String, val country: String? = null, val events: Int)

@Serializable
public data class LocationList(val mode: String, val locations: List<Place>)

/** A problem, in plain words (RFC 9457). */
@Serializable
public data class Problem(
    val type: String? = null,
    val title: String,
    val status: Int,
    val detail: String,
    @SerialName("request_id") val requestId: String? = null,
    val code: String? = null,
)
