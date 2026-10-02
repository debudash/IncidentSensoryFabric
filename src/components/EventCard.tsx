import { IdentityChips } from "./IdentityChips.tsx";
import {
  ADAPTER_LABEL,
  KIND_LABEL,
  eventSummary,
  formatDuration,
  formatIncidentTime,
  payloadNumber,
  payloadText,
} from "../lib/format.ts";
import { shortHash } from "../lib/provenance.ts";
import type { Actor, TimelineEvent, VideoLane } from "../types.ts";

type Props = {
  event: TimelineEvent;
  actor?: Actor;
  selected: boolean;
  dimmed: boolean;
  speaking: boolean;
  videoLane: VideoLane;
  verified: boolean;
  onSelect: (eventId: string) => void;
};

export function EventCard({
  event,
  actor,
  selected,
  dimmed,
  speaking,
  videoLane,
  verified,
  onSelect,
}: Props) {
  const laneClass = event.kind === "video_clip" ? `lane-${videoLane}` : "";
  const summary = eventSummary(event);
  const confidence = payloadNumber(event.payload, "confidence");

  return (
    <li className={`event-row kind-${event.kind} ${laneClass} ${dimmed ? "is-dim" : "is-owned"}`}>
      <time dateTime={event.t}>{formatIncidentTime(event.t)}</time>
      <button
        type="button"
        className={`event-card ${selected ? "is-selected" : ""}`}
        aria-pressed={selected}
        onClick={() => onSelect(event.provenance.eventId)}
      >
        <div className="event-top">
          <span className={`kind-pill kind-${event.kind}`}>
            {KIND_LABEL[event.kind]}
          </span>
          <span className="event-who">{actor?.callsign ?? event.identity.mcpttId}</span>
          {speaking ? <SpeakBar /> : null}
          <span className={`verify ${verified ? "is-ok" : "is-bad"}`}>
            {verified ? "Verified" : "Hash broken"}
          </span>
        </div>
        <IdentityChips identity={event.identity} />
        {event.kind === "video_clip" ? (
          <VideoStub event={event} lane={videoLane} />
        ) : (
          <p className={`event-summary ${event.kind === "asr_snippet" ? "is-quote" : ""}`}>
            {summary}
          </p>
        )}
        {event.kind === "audio_turn" ? (
          <p className="stub-note">
            Voice only · {payloadText(event.payload, "codec") || "codec unset"} ·{" "}
            {formatDuration(payloadNumber(event.payload, "durationMs") ?? 0)}. No audio file.
          </p>
        ) : null}
        {event.kind === "asr_snippet" && confidence !== null ? (
          <p className="stub-note">Heard confidence {confidence.toFixed(2)}</p>
        ) : null}
        {event.kind === "ntn_path" ? (
          <p className="stub-note">{payloadText(event.payload, "note")}</p>
        ) : null}
        <p className="prov-line">
          <span>{ADAPTER_LABEL[event.provenance.sourceAdapter]}</span>
          <span>ingest {formatIncidentTime(event.provenance.ingestedAt)}</span>
          <span>sha256 {shortHash(event.provenance.contentHash)}</span>
        </p>
      </button>
    </li>
  );
}

function SpeakBar() {
  return (
    <span className="speak-bar is-live" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function VideoStub({ event, lane }: { event: TimelineEvent; lane: VideoLane }) {
  const source = payloadText(event.payload, "source");
  const stamp =
    lane === "unavailable"
      ? "Video offline"
      : lane === "unreliable"
        ? "Picture suspect"
        : null;
  return (
    <div className={`video-stub source-${source || "video"}`}>
      <div className="video-frame">
        <span className="video-kicker">{source === "bodycam" ? "BODYCAM STUB" : "DRONE STUB"}</span>
        <strong>{payloadText(event.payload, "thumbnailLabel") || "SIM CLIP"}</strong>
        <span>
          {payloadText(event.payload, "resolution") || "stub"} ·{" "}
          {formatDuration(payloadNumber(event.payload, "durationMs") ?? 0)}
        </span>
      </div>
      {stamp ? <p className="video-stamp">{stamp}</p> : null}
      <p className="stub-note">{payloadText(event.payload, "note") || "Clip stub only."}</p>
    </div>
  );
}
