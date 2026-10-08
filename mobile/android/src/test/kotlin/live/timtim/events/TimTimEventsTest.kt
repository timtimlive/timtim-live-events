package live.timtim.events

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue
import java.net.URI

class TimTimEventsTest {
    private fun fixture(name: String): String =
        requireNotNull(javaClass.getResource("/fixtures/$name")) { "missing fixture $name" }.readText()

    /** A transport that answers from a function and remembers every request. */
    private class Fake(val respond: (HttpRequest) -> HttpResponse) : HttpTransport {
        val seen = mutableListOf<HttpRequest>()
        override fun send(request: HttpRequest): HttpResponse = respond(request).also { seen += request }
    }

    private fun query(url: String): Map<String, String> =
        URI(url).rawQuery?.split("&")?.associate { it.substringBefore("=") to java.net.URLDecoder.decode(it.substringAfter("="), "UTF-8") } ?: emptyMap()

    @Test
    fun decodesARealCapturedAnswer() {
        val list = TimTimEvents.json.decodeFromString<EventList>(fixture("city-miami-category-music.200.json"))
        assertEquals("test", list.mode)
        val event = list.events.first()
        assertEquals("evt_test_miami_konpa", event.id)
        assertEquals("Miami", event.location.city)
        assertTrue(event.test)
        assertTrue(event.tickets.buyUrl!!.startsWith("https://"))
    }

    @Test
    fun aCancelledEventHasNoTicketLink() {
        val event = TimTimEvents.json.decodeFromString<EventList>(fixture("simulate-cancelled.200.json")).events.first()
        assertEquals(EventStatus.CANCELLED, event.statusKind)
        assertNull(event.ticketUrl)
    }

    @Test
    fun anUnknownStatusIsNotAnError() {
        assertEquals(EventStatus.UNKNOWN, EventStatus.of("on_the_moon"))
        assertEquals(EventStatus.SOLD_OUT, EventStatus.of("sold_out"))
    }

    @Test
    fun noKeyReadsSampleEventsWithoutAnAuthorizationHeader() {
        val fake = Fake { HttpResponse(200, emptyMap(), fixture("city-miami-category-music.200.json")) }
        val page = TimTimEvents(transport = fake).events(EventQuery(city = "Miami", country = "us", category = "Music", limit = 500))
        assertEquals(1, page.events.size)
        val request = fake.seen.single()
        assertEquals("/v1/demo/events", URI(request.url).path)
        assertEquals(mapOf("city" to "Miami", "country" to "US", "category" to "music", "limit" to "100"), query(request.url))
        assertNull(request.headers["Authorization"])
    }

    @Test
    fun aKeyUsesEventsWithABearerHeader() {
        val fake = Fake { HttpResponse(200, emptyMap(), fixture("city-miami-category-music.200.json")) }
        TimTimEvents("tt_test_example_key", transport = fake).events(EventQuery(latitude = 38.9, longitude = -77.0, radiusKm = 20.0))
        val request = fake.seen.single()
        assertEquals("/v1/events", URI(request.url).path)
        assertEquals("Bearer tt_test_example_key", request.headers["Authorization"])
        assertEquals(mapOf("lat" to "38.9", "lng" to "-77.0", "radius" to "20.0"), query(request.url))
    }

    @Test
    fun aServerKeyIsRefusedInAnApp() {
        assertFailsWith<TimTimException.ServerKeyInApp> { TimTimEvents("tt_sk_live_abc") }
    }

    @Test
    fun aProblemComesBackInPlainWordsWithRetryAfter() {
        val fake = Fake { HttpResponse(429, mapOf("retry-after" to "30"), fixture("simulate-rate_limited.429.json")) }
        val e = assertFailsWith<TimTimException.Api> { TimTimEvents(transport = fake).events() }
        assertEquals(429, e.status)
        assertEquals("rate_limited", e.code)
        assertEquals(30, e.retryAfter)
        assertTrue(e.title.isNotBlank())
    }

    @Test
    fun trackSendsAPublicKeyAndNeverThrows() {
        val fake = Fake { HttpResponse(204, emptyMap(), "") }
        val ok = TimTimEvents("tt_pk_live_example_key", transport = fake).track(TimTimEvents.Signal.EVENT_CLICK, eventId = "evt_1", view = "pv_12345678")
        assertTrue(ok)
        val request = fake.seen.single()
        assertEquals("POST", request.method)
        assertEquals("/v1/track", URI(request.url).path)
        assertEquals("text/plain", request.headers["Content-Type"])
        assertTrue(request.body!!.contains("\"key\":\"tt_pk_live_example_key\""))
        val broken = TimTimEvents(transport = { throw java.io.IOException("offline") })
        assertFalse(broken.track(TimTimEvents.Signal.IMPRESSION))
    }
}
