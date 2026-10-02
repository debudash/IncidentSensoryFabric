import { formatBitrate, formatIncidentTime, formatRtt, pathLabel, payloadNumber, payloadText } from "../lib/format.ts";
import { eventTimeMs, pathStateName } from "../lib/playback.ts";
import type { TimelineEvent } from "../types.ts";

type Props = {
  events: TimelineEvent[];
  playheadMs: number;
  onJump: (ms: number) => void;
  starnoteOn: boolean;
  onToggleStarnote: () => void;
};

export function PathState({ events, playheadMs, onJump, starnoteOn, onToggleStarnote }: Props) {
  const pathEvents = events.filter((event) => event.kind === "ntn_path");
  const active = [...pathEvents].reverse().find((event) => eventTimeMs(event) <= playheadMs);

  return (
    <section className="path-strip" aria-label="NTN path state">
      <div className="path-strip-head">
        <h2>Path</h2>
        <p>Terrestrial, then degraded, then narrowband. Not a live satellite.</p>
        <button
          type="button"
          className="starnote-toggle"
          aria-pressed={starnoteOn}
          onClick={onToggleStarnote}
        >
          Starnote stub
        </button>
      </div>
      <ol className="path-fsm">
        {pathEvents.map((event, index) => {
          const state = pathStateName(event) ?? "TERRESTRIAL";
          const reached = eventTimeMs(event) <= playheadMs;
          const current = active?.provenance.eventId === event.provenance.eventId;
          const rtt = payloadNumber(event.payload, "rttMs") ?? 0;
          const bitrate = payloadNumber(event.payload, "bitrateKbps") ?? 0;
          const loss = payloadNumber(event.payload, "lossPct");
          return (
            <li key={event.provenance.eventId} className="path-step">
              {index > 0 ? <span className={`path-join ${reached ? "is-on" : ""}`} /> : null}
              <button
                type="button"
                className={`path-node path-${state.toLowerCase()} ${reached ? "is-reached" : ""} ${current ? "is-current" : ""}`}
                onClick={() => {
                const cue = events.find(
                  (item) =>
                    item.kind === "decision_cue" && item.payload.triggeredByState === state,
                );
                const at = eventTimeMs(event);
                onJump(cue ? Math.max(at, eventTimeMs(cue)) : at);
              }}
              >
                <span className="path-node-k">{String(index + 1).padStart(2, "0")}</span>
                <strong>{pathLabel(state)}</strong>
                <span className="mono path-node-code">{state}</span>
                <span>
                  {formatRtt(rtt)} · {formatBitrate(bitrate)}
                  {loss !== null ? ` · ${loss}% loss` : ""}
                </span>
                <span className="path-node-t">{formatIncidentTime(event.t)}</span>
                <span className="path-node-b">{payloadText(event.payload, "bearer")}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
