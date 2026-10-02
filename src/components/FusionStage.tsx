import { IdentityChips } from "./IdentityChips.tsx";
import { SpokenIntel } from "./SpokenIntel.tsx";
import { formatDuration, payloadNumber, payloadText } from "../lib/format.ts";
import { pttWindow } from "../lib/playback.ts";
import type { Actor, TimelineEvent, VideoLane } from "../types.ts";

type Props = {
  events: TimelineEvent[];
  actors: Actor[];
  selectedId: string | null;
  playheadMs: number;
  lane: VideoLane;
  onSelect: (eventId: string) => void;
};

export function FusionStage({ events, actors, selectedId, playheadMs, lane, onSelect }: Props) {
  const selected = events.find((event) => event.provenance.eventId === selectedId) ?? null;
  const focusId = selected?.identity.mcpttId ?? null;
  const actor = actors.find((item) => item.mcpttId === focusId);
  const mine = events.filter((event) => event.identity.mcpttId === focusId);
  const myVideos = mine.filter((event) => event.kind === "video_clip");
  const otherVideos = events.filter(
    (event) => event.kind === "video_clip" && event.identity.mcpttId !== focusId,
  );
  const liveAudio = mine.find((event) => pttWindow(event, playheadMs));
  const latestAudio = [...mine].reverse().find((event) => event.kind === "audio_turn");
  const speaking = liveAudio ?? latestAudio ?? null;
  const latestAsr = [...mine].reverse().find((event) => event.kind === "asr_snippet");
  const quote = latestAsr ? payloadText(latestAsr.payload, "text") : speaking ? payloadText(speaking.payload, "transcriptPreview") : "";

  return (
    <section className="stage" aria-label="Sensory stage">
      <div className="stage-fade" key={focusId ?? "waiting"}>
        <header className="stage-who">
          <p className="kicker">Who&apos;s up</p>
          {actor ? (
            <>
              <h2>{actor.callsign}</h2>
              <p className="stage-role">
                Role · {actor.role}
                {actor.functionalAlias ? (
                  <>
                    {" "}
                    <span className="mono">{actor.functionalAlias}</span>
                  </>
                ) : (
                  <span className="mono"> · no functional alias</span>
                )}
              </p>
              {speaking ? (
                <div className={`speak-presence ${liveAudio ? "is-live" : "is-settled"}`}>
                  <SpeakBar live={Boolean(liveAudio)} />
                  <p>{liveAudio ? "On the air" : "Last voice on this role"}</p>
                </div>
              ) : null}
              {quote ? <p className="stage-quote">{quote}</p> : null}
              {selected ? <IdentityChips identity={selected.identity} /> : null}
            </>
          ) : (
            <h2>Waiting on keyed media…</h2>
          )}
        </header>

        <div className="joined-block">
          <p className="kicker">Joined media</p>
          {actor && myVideos.length === 0 ? (
            <p className={`media-gap lane-${lane}`}>
              No camera on {actor.callsign}.
              {lane === "unavailable"
                ? " Video is offline on this path."
                : lane === "unreliable"
                  ? " Picture on the talkgroup is suspect."
                  : " Voice is what joined this role."}
            </p>
          ) : null}
          {myVideos.length > 0 ? (
            <div className="joined-row">
              {myVideos.map((event) => (
                <CameraCard key={event.provenance.eventId} event={event} actors={actors} lane={lane} owned onSelect={onSelect} />
              ))}
            </div>
          ) : null}
          {otherVideos.length > 0 ? (
            <>
              <p className="panel-note other-cams">Other cameras on the talkgroup</p>
              <div className="joined-row">
                {otherVideos.map((event) => (
                  <CameraCard key={event.provenance.eventId} event={event} actors={actors} lane={lane} owned={false} onSelect={onSelect} />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <SpokenIntel
          events={events}
          actors={actors}
          lane={lane}
          selectedId={selectedId}
          focusId={focusId}
          onSelect={onSelect}
        />
      </div>
    </section>
  );
}

function CameraCard({
  event,
  actors,
  lane,
  owned,
  onSelect,
}: {
  event: TimelineEvent;
  actors: Actor[];
  lane: VideoLane;
  owned: boolean;
  onSelect: (eventId: string) => void;
}) {
  const who = actors.find((item) => item.mcpttId === event.identity.mcpttId);
  const source = payloadText(event.payload, "source");
  return (
    <button
      type="button"
      className={`joined-card ${owned ? "is-owned" : "is-dim"} lane-${lane}`}
      onClick={() => onSelect(event.provenance.eventId)}
    >
      <span className="joined-k">
        {source === "bodycam" ? "Body camera" : "Drone"}
        {owned ? <span className="join-mark">Joined</span> : null}
      </span>
      <span className="video-frame">
        <strong>{who?.callsign ?? "Camera"}</strong>
        <span>
          {payloadText(event.payload, "thumbnailLabel") || "Clip"}
          {" · "}
          {formatDuration(payloadNumber(event.payload, "durationMs") ?? 0)}
        </span>
      </span>
      {lane !== "clear" ? (
        <span className="video-stamp">{lane === "unavailable" ? "Video offline" : "Picture suspect"}</span>
      ) : null}
    </button>
  );
}

function SpeakBar({ live }: { live: boolean }) {
  return (
    <span className={`speak-bar ${live ? "is-live" : "is-settled"}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
