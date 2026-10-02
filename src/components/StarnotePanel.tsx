import { formatBitrate, formatRtt } from "../lib/format.ts";
import type { StarnoteReading } from "../lib/starnoteStub.ts";

export function StarnotePanel({ reading }: { reading: StarnoteReading }) {
  return (
    <section className="starnote" aria-label="Starnote stub">
      <div className="starnote-card">
        <div className="event-top">
          <span className="kind-pill">Starnote stub</span>
          <span className="sim-badge">SIMULATED</span>
          <span className="event-who">{reading.state}</span>
        </div>
        <p className="starnote-metrics">
          <span className="mono">{reading.sourceAdapter}</span>
          <span>
            {reading.rttMs === null ? "RTT unset" : formatRtt(reading.rttMs)}
            {" · "}
            {reading.bitrateKbps === null ? "bitrate unset" : formatBitrate(reading.bitrateKbps)}
          </span>
          <span>bearer {reading.bearer}</span>
        </p>
        <p className="stub-note">{reading.note}</p>
      </div>
    </section>
  );
}
