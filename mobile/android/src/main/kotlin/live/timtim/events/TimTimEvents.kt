package live.timtim.events

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder

/** Something went wrong. [Api] carries TimTim.Live's own explanation. */
public sealed class TimTimException(message: String) : Exception(message) {
    /** A server key (tt_sk_live_…) or access token in an app: anyone can read an app's files, so it is refused. */
    public class ServerKeyInApp : TimTimException("Never put a server key (tt_sk_live_…) in an app. Use a website key (tt_pk_live_…) or call TimTim.Live from your own server.")
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
    }

    /** One page of events. With no key: sample events from /demo/events. */
    public fun events(query: EventQuery = EventQuery()): EventList = get(if (apiKey == null) "demo/events" else "events", query.params())

    /** One event, even after it was cancelled or ended. Needs a key. */
    public fun event(id: String): Event {
        if (apiKey == null) throw TimTimException.KeyRequired("event(id)")
        return get<EventResponse>("events/" + URLEncoder.encode(id, "UTF-8"), emptyList()).event
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
            val retry = response.headers.entries.firstOrNull { it.key.equals("retry-after", ignoreCase = true) }?.value?.toIntOrNull()
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
    }
}
