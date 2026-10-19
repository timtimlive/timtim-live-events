package live.timtim.events

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder
import java.time.Duration
import java.time.Instant
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

/** Something went wrong. [Api] carries TimTim.Live's own explanation. */
public sealed class TimTimException(message: String) : Exception(message) {
    /** A server key (tt_sk_live_…) or access token in an app: anyone can read an app's files, so it is refused. */
    public class ServerKeyInApp : TimTimException("Never put a server key (tt_sk_live_…) in an app. Use a website key (tt_pk_live_…) or call TimTim.Live from your own server.")
    /** The base URL is not https. Plain http is allowed only for local testing (localhost, 127.0.0.1, 10.0.2.2). */
    public class InsecureBaseUrl(url: String) : TimTimException("The base URL must start with https:// (plain http only for localhost, 127.0.0.1 or 10.0.2.2 while testing). Got: $url")
    public class KeyRequired(what: String) : TimTimException("$what needs a key. Get a free test key at https://timtim.live/partners/dashboard.")
    public class Api(public val status: Int, public val code: String?, public val title: String, public val detail: String, public val requestId: String?, public val retryAfter: Int?) :
        TimTimException("$status $title $detail" + (requestId?.let { " (request $it)" } ?: ""))
    public class InvalidResponse(public val status: Int) : TimTimException("TimTim.Live answered $status but not with JSON we understand.")
    public class Network(cause: Throwable) : TimTimException("Could not reach TimTim.Live: ${cause.message}")
}

/** What to search for. Leave everything null for upcoming events, soonest first. */
public data class EventQuery(
    val city: String? = null,
    val country: String? = null,
    val category: String? = null,
    val from: String? = null,
    val to: String? = null,
    val artist: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val radiusKm: Double? = null,
    val limit: Int? = null,
    val cursor: String? = null,
) {
    internal fun params(): List<Pair<String, String>> = listOfNotNull(
        city?.let { "city" to it }, country?.let { "country" to it.uppercase() }, category?.let { "category" to it.lowercase() },
        from?.let { "from" to it }, to?.let { "to" to it }, artist?.let { "artist" to it },
        latitude?.let { "lat" to it.toString() }, longitude?.let { "lng" to it.toString() }, radiusKm?.let { "radius" to it.toString() },
        limit?.let { "limit" to it.coerceIn(1, 100).toString() }, cursor?.let { "cursor" to it },
    ).filter { it.second.isNotEmpty() }
}

/** The HTTP layer, replaceable (tests use a fake; an app may plug in OkHttp). */
public fun interface HttpTransport {
    public fun send(request: HttpRequest): HttpResponse
}

public data class HttpRequest(val method: String, val url: String, val headers: Map<String, String>, val body: String? = null)
public data class HttpResponse(val status: Int, val headers: Map<String, String>, val body: String)

/** The default transport: java.net.HttpURLConnection — on every JVM and on Android, no extra dependency. */
public object UrlConnectionTransport : HttpTransport {
    override fun send(request: HttpRequest): HttpResponse {
        val conn = URI(request.url).toURL().openConnection() as HttpURLConnection
        try {
            conn.requestMethod = request.method
            // Never follow a redirect: it could carry the Authorization header to another host, or downgrade to http.
            conn.instanceFollowRedirects = false
            conn.connectTimeout = 10_000
            conn.readTimeout = 15_000
            request.headers.forEach { (k, v) -> conn.setRequestProperty(k, v) }
            if (request.body != null) {
                conn.doOutput = true
                conn.outputStream.use { it.write(request.body.toByteArray(Charsets.UTF_8)) }
            }
            val status = conn.responseCode
            val stream = if (status >= 400) conn.errorStream else conn.inputStream
            val body = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
            val headers = conn.headerFields.filterKeys { it != null }.mapValues { it.value.joinToString(",") }.mapKeys { it.key.lowercase() }
            return HttpResponse(status, headers, body)
        } finally {
            conn.disconnect()
        }
    }
}

/**
 * The TimTim.Live events API.
 *
 *     val timtim = TimTimEvents()                         // sample events, no key
 *     val page = timtim.events(EventQuery(city = "Miami")) // call off the main thread
 *
 * Calls are blocking: on Android run them on a background thread,
 * for example `withContext(Dispatchers.IO) { timtim.events(...) }`.
 * With no key every answer is sample data (`mode == "test"`).
 */
public class TimTimEvents(
    apiKey: String? = null,
    public val baseUrl: String = DEFAULT_BASE_URL,
    private val transport: HttpTransport = UrlConnectionTransport,
) {
    public val apiKey: String? = apiKey?.takeIf { it.isNotBlank() }

    init {
        if (this.apiKey != null && (this.apiKey.startsWith("tt_sk_live_") || this.apiKey.startsWith("tt_at_"))) throw TimTimException.ServerKeyInApp()
        // A key travels in every request: never over plain http, except to this machine or the Android emulator's host.
        if (!isAllowedBaseUrl(baseUrl)) throw TimTimException.InsecureBaseUrl(baseUrl)
    }

    /** One page of events. With no key: sample events from /demo/events. */
    public fun events(query: EventQuery = EventQuery()): EventList = get(if (apiKey == null) "demo/events" else "events", query.params())

    /** One event, even after it was cancelled or ended. Needs a key. */
    public fun event(id: String): Event {
        if (apiKey == null) throw TimTimException.KeyRequired("event(id)")
        return get<EventResponse>("events/" + encodePathSegment(id), emptyList()).event
    }

    /** Event types with upcoming events, and how many. */
    public fun categories(country: String? = null): CategoryList =
        get(if (apiKey == null) "demo/categories" else "categories", listOfNotNull(country?.let { "country" to it.uppercase() }))

    /** Cities with upcoming events, and how many. */
    public fun locations(country: String? = null, limit: Int? = null): LocationList =
        get(if (apiKey == null) "demo/locations" else "locations", listOfNotNull(country?.let { "country" to it.uppercase() }, limit?.let { "limit" to it.coerceIn(1, 500).toString() }))

    public enum class Signal(public val wire: String) { IMPRESSION("impression"), EVENT_VIEW("event_view"), EVENT_CLICK("event_click") }

    /** Tell TimTim.Live what was shown or tapped, so your dashboard can count it. Never money. Never throws; true when TimTim.Live answered 204. */
    public fun track(signal: Signal, eventId: String? = null, shown: Int? = null, view: String? = null): Boolean {
        val body = buildJsonObject {
            put("type", signal.wire)
            eventId?.let { put("event_id", it) }
            shown?.let { put("shown", it) }
            view?.let { put("view", it) }
            apiKey?.takeIf { it.startsWith("tt_pk_live_") || it.startsWith("tt_test_") }?.let { put("key", it) }
        }
        return try {
            transport.send(HttpRequest("POST", "${baseUrl.trimEnd('/')}/track", mapOf("Content-Type" to "text/plain"), body.toString())).status == 204
        } catch (_: Exception) {
            false
        }
    }

    private inline fun <reified T> get(path: String, params: List<Pair<String, String>>): T {
        val query = if (params.isEmpty()) "" else "?" + params.joinToString("&") { (k, v) -> "${URLEncoder.encode(k, "UTF-8")}=${URLEncoder.encode(v, "UTF-8")}" }
        val headers = buildMap {
            put("Accept", "application/json")
            put("User-Agent", "timtim-kotlin/$VERSION")
            if (apiKey != null && !path.startsWith("demo/")) put("Authorization", "Bearer $apiKey")
        }
        val response = try {
            transport.send(HttpRequest("GET", "${baseUrl.trimEnd('/')}/$path$query", headers))
        } catch (e: IOException) {
            throw TimTimException.Network(e)
        }
        if (response.status !in 200..299) {
            val problem = runCatching { json.decodeFromString<Problem>(response.body) }.getOrNull()
                ?: throw TimTimException.InvalidResponse(response.status)
            val retry = response.headers.entries.firstOrNull { it.key.equals("retry-after", ignoreCase = true) }?.value.let { retryAfterSeconds(it) }
            throw TimTimException.Api(response.status, problem.code, problem.title, problem.detail, problem.requestId, retry)
        }
        return try {
            json.decodeFromString<T>(response.body)
        } catch (_: Exception) {
            throw TimTimException.InvalidResponse(response.status)
        }
    }

    public companion object {
        public const val DEFAULT_BASE_URL: String = "https://api.timtim.live/v1"
        public const val VERSION: String = "0.1.0"
        internal val json: Json = Json { ignoreUnknownKeys = true; explicitNulls = false }
        private val LOCAL_HOSTS = setOf("localhost", "127.0.0.1", "10.0.2.2")
        private const val HEX = "0123456789ABCDEF"

        /** https anywhere; plain http only to localhost, 127.0.0.1 or 10.0.2.2 (the Android emulator's name for this computer). */
        internal fun isAllowedBaseUrl(url: String): Boolean {
            val uri = try { URI(url) } catch (_: Exception) { return false }
            val scheme = uri.scheme?.lowercase() ?: return false
            val host = uri.host?.lowercase()?.takeIf { it.isNotEmpty() } ?: return false
            return scheme == "https" || (scheme == "http" && host in LOCAL_HOSTS)
        }

        /** One path segment: RFC 3986 unreserved letters stay, everything else (space, "/", "%", ".", "+", non-ASCII) becomes %XX. Never "+" for a space. */
        internal fun encodePathSegment(value: String): String = buildString {
            for (b in value.toByteArray(Charsets.UTF_8)) {
                val c = b.toInt() and 0xff
                val ch = c.toChar()
                if (ch in 'A'..'Z' || ch in 'a'..'z' || ch in '0'..'9' || ch == '-' || ch == '_' || ch == '~') append(ch)
                else append('%').append(HEX[c shr 4]).append(HEX[c and 0x0f])
            }
        }

        /** Retry-After is seconds ("30") or an HTTP-date ("Wed, 21 Oct 2026 07:28:00 GMT"). Whole seconds to wait, never negative. */
        internal fun retryAfterSeconds(value: String?, now: Instant = Instant.now()): Int? {
            val raw = value?.trim()?.takeIf { it.isNotEmpty() } ?: return null
            raw.toIntOrNull()?.let { return it.coerceAtLeast(0) }
            return try {
                val at = ZonedDateTime.parse(raw, DateTimeFormatter.RFC_1123_DATE_TIME).toInstant()
                val ms = Duration.between(now, at).toMillis()
                if (ms <= 0) 0 else ((ms + 999) / 1000).coerceAtMost(Int.MAX_VALUE.toLong()).toInt()
            } catch (_: DateTimeParseException) {
                null
            }
        }
    }
}
