import { useEffect, useRef } from "react";
import { EventCard } from "./EventCard.tsx";
import { identityCoverage } from "../lib/join.ts";
import { pttWindow } from "../lib/playback.ts";
import type { Actor, TimelineEvent, VideoLane } from "../types.ts";

type Props = {
  incidentEvents: TimelineEvent[];
  visibleEvents: TimelineEvent[];
  actors: Actor[];
  videoLane: VideoLane;
  verified: Map<string, boolean>;
  selectedId: string | null;
  focusId: string | null;
  playheadMs: number;
  onSelect: (eventId: string) => void;
};

export function Timeline({
  incidentEvents,
  visibleEvents,
  actors,
  videoLane,
  verified,
  selectedId,
  focusId,
  playheadMs,
  onSelect,
}: Props) {
  const listRef = useRef<HTMLOListElement>(null);
  const coverage = identityCoverage(incidentEvents);
  const actorsById = new Map(actors.map((actor) => [actor.mcpttId, actor]));
  const keyed =
    coverage.withMcpttId === coverage.total && coverage.withTalkgroup === coverage.total;

  useEffect(() => {
    if (!selectedId) return;
    const node = listRef.current?.querySelector(".is-selected");
    if (node instanceof HTMLElement) node.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  return (
    <section className="panel timeline-panel" aria-label="Identity-keyed timeline">
      <div className="panel-head">
        <h2>Turns</h2>
        <p className="panel-note">
          {visibleEvents.length} of {incidentEvents.length} at this moment
        </p>
      </div>
      <p className={`coverage ${keyed ? "is-ok" : "is-bad"}`}>
        {keyed
          ? `${coverage.withMcpttId}/${coverage.total} turns name a person and a talkgroup. ${coverage.withFunctionalAlias} also name a role alias.`
          : "A turn is missing the person or the talkgroup."}
      </p>
      <div className={`lane-status lane-${videoLane}`}>
        <div>
          <span>Voice</span>
          <strong>Keyed</strong>
        </div>
        <div>
          <span>Voice text</span>
          <strong>Keyed</strong>
        </div>
        <div>
          <span>Camera</span>
          <strong>
            {videoLane === "clear" ? "Up" : videoLane === "unreliable" ? "Suspect" : "Offline"}
          </strong>
        </div>
        <div>
          <span>Path</span>
          <strong>
            {videoLane === "clear" ? "Terrestrial" : videoLane === "unreliable" ? "Degraded" : "Narrowband"}
          </strong>
        </div>
      </div>
      {visibleEvents.length === 0 ? (
        <p className="empty">Waiting on keyed media…</p>
      ) : (
        <ol className="timeline" ref={listRef}>
          {visibleEvents.map((event) => (
            <EventCard
              key={event.provenance.eventId}
              event={event}
              actor={actorsById.get(event.identity.mcpttId)}
              selected={selectedId === event.provenance.eventId}
              dimmed={focusId !== null && event.identity.mcpttId !== focusId}
              speaking={pttWindow(event, playheadMs)}
              videoLane={videoLane}
              verified={verified.get(event.provenance.eventId) ?? false}
              onSelect={onSelect}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
