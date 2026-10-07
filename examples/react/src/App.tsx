import { useState } from "react";
import { TimTimEvents, TimTimProvider, type UseTimTimEventsParams } from "@timtim-live/react";

/*
 * No key = demo mode (sample events, no sign-up).
 * To use your own key, create .env.local with VITE_TIMTIM_KEY=tt_test_YOUR_KEY
 * — only a test key or a website key (tt_pk_live_…). A server key is refused in a browser.
 */
const apiKey = import.meta.env.VITE_TIMTIM_KEY as string | undefined;

const CITIES = ["Miami", "Washington", "Paris", "Montreal"];

export function App() {
  const [city, setCity] = useState("Miami");
  const [simulate, setSimulate] = useState<UseTimTimEventsParams["simulate"]>(undefined);

  return (
    <TimTimProvider apiKey={apiKey}>
      <h1>Events in {city}</h1>
      <p>Sample events — no real money.</p>
      <p>
        <label>
          City{" "}
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Pretend{" "}
          <select value={simulate ?? ""} onChange={(e) => setSimulate((e.target.value || undefined) as UseTimTimEventsParams["simulate"])}>
            <option value="">a normal day</option>
            <option value="sold_out">sold out</option>
            <option value="cancelled">cancelled</option>
            <option value="rate_limited">too many requests (error)</option>
          </select>
        </label>
      </p>
      <TimTimEvents city={city} simulate={simulate} limit={6} />
    </TimTimProvider>
  );
}
