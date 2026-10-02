import { IdentityChips } from "./IdentityChips.tsx";
import { formatIncidentTime, payloadNumber, payloadText } from "../lib/format.ts";
import { shortHash } from "../lib/provenance.ts";
import type { Actor, TimelineEvent, VideoLane } from "../types.ts";

type Props = {
  events: TimelineEvent[];
  actors: Actor[];
  lane: VideoLane;
  selectedId: string | null;
  focusId: string | null;
  onSelect: (eventId: string) => void;
};

export function SpokenIntel({ events, actors, lane, selectedId, focusId, onSelect }: Props) {
  const actorsById = new Map(actors.map((actor) => [actor.mcpttId, actor]));
  const snippets = events.filter((event) => event.kind === "asr_snippet");
  const primary = lane !== "clear";

  return (
    <aside className={`panel spoken ${primary ? "is-primary" : ""}`} aria-label="Talkgroup voice">
      <div className="panel-head">
        <div>
          <p className="kicker">Talkgroup voice</p>
          <h2>Who said what</h2>
        </div>
      </div>
      <p className="panel-note">
        {primary
          ? "Still keyed to the person. Not a written report."
          : "Keyed to the person. Not a written report."}
      </p>
      {snippets.length === 0 ? (
        <p className="empty">Waiting on keyed media…</p>
      ) : (
        <ol className="spoken-list">
          {snippets.map((event) => {
            const confidence = payloadNumber(event.payload, "confidence");
            const actor = actorsById.get(event.identity.mcpttId);
            const selected = event.provenance.eventId === selectedId;
            const owned = event.identity.mcpttId === focusId;
            return (
              <li key={event.provenance.eventId} className={owned ? "is-owned" : "is-dim"}>
                <button
                  type="button"
                  className={`spoken-card ${selected ? "is-selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => onSelect(event.provenance.eventId)}
                >
                  <div className="event-top">
                    <span className="kind-pill kind-asr_snippet">Voice text</span>
                    <span className="event-who">{actor?.callsign ?? event.identity.mcpttId}</span>
                    <time dateTime={event.t}>{formatIncidentTime(event.t)}</time>
                  </div>
                  <p className="event-summary is-quote">{payloadText(event.payload, "text")}</p>
                  <IdentityChips identity={event.identity} />
                  <p className="confidence-label">
                    <span className="confidence-chip">
                      {confidence !== null ? confidence.toFixed(2) : "—"}
                    </span>
                    <span>heard confidence</span>
                  </p>
                  <p className="prov-line">
                    <span className="mono">{event.provenance.eventId}</span>
                    <span>sha256 {shortHash(event.provenance.contentHash)}</span>
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
