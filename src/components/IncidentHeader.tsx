import { formatBitrate, formatClock, formatRtt, pathLabel, payloadNumber, payloadText } from "../lib/format.ts";
import type { PathStateName, TimelineEvent } from "../types.ts";

type Props = {
  incidentId: string;
  title: string;
  location: string;
  talkgroupId: string;
  playheadMs: number;
  pathEvent: TimelineEvent | null;
  pathState: PathStateName | null;
  onExport: () => void;
};

export function IncidentHeader({
  incidentId,
  title,
  location,
  talkgroupId,
  playheadMs,
  pathEvent,
  pathState,
  onExport,
}: Props) {
  const state = pathState ?? "TERRESTRIAL";
  const pulse = state === "DEGRADED" || state === "NTN_NARROWBAND";
  const rtt = pathEvent ? payloadNumber(pathEvent.payload, "rttMs") : null;
  const bitrate = pathEvent ? payloadNumber(pathEvent.payload, "bitrateKbps") : null;
  const bearer = pathEvent ? payloadText(pathEvent.payload, "bearer") : "";

  return (
    <header className="rail">
      <div className="rail-id">
        <div className="header-mark" aria-hidden="true">
          ISF
        </div>
        <div className="header-copy">
          <p className="eyebrow">Incident Sensory Fabric</p>
          <h1>{title}</h1>
          <p className="incident-name mono">{incidentId}</p>
        </div>
      </div>
      <div className="rail-mid">
        <p className="sim-pill">SIMULATED · CAPSTONE DEMO</p>
        <p className="rail-tg">
          <span className="kicker">Talkgroup</span>
          <span className="mono">{talkgroupId}</span>
        </p>
        <p className="header-meta">{location}</p>
      </div>
      <div className="rail-end">
        <time className="rail-clock mono" dateTime={new Date(playheadMs).toISOString()}>
          {formatClock(playheadMs)}
        </time>
        <div className="export-wrap">
          <button type="button" className="export" onClick={onExport}>
            After-action pack
          </button>
          <p className="export-note">Incident, path, orders, and keyed voice.</p>
        </div>
        <div
          className={`path-chip path-${state.toLowerCase()} ${pulse ? "is-live" : ""}`}
          title={bearer ? `Bearer ${bearer}` : undefined}
        >
          <span className="path-chip-k">Path</span>
          <strong>{pathLabel(state)}</strong>
          <span className="path-chip-m">
            <span className="mono">{state}</span>
            {rtt !== null && bitrate !== null ? ` · ${formatRtt(rtt)} · ${formatBitrate(bitrate)}` : ""}
          </span>
        </div>
      </div>
    </header>
  );
}
