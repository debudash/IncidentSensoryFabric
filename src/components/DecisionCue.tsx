import { payloadText } from "../lib/format.ts";
import type { TimelineEvent, VideoLane } from "../types.ts";

type Props = {
  cue: TimelineEvent | null;
  lane: VideoLane;
  talkgroupId: string;
};

export function DecisionCue({ cue, lane, talkgroupId }: Props) {
  if (!cue || lane === "clear") return null;
  const message = payloadText(cue.payload, "message");
  const critical = lane === "unavailable";
  const headline = critical
    ? "PATH NARROWBAND — video offline — trust keyed talkgroup voice/ASR"
    : "PATH DEGRADED — picture is suspect — stay with talkgroup voice";

  return (
    <section className={`decision ${critical ? "decision-critical" : "decision-caution"}`} aria-live="polite" role="status">
      <p className="decision-k">Order</p>
      <p className="decision-msg">{headline}</p>
      <p className="decision-sub">
        Talkgroup <span className="mono">{talkgroupId}</span>
        {message ? ` · ${message}` : ""}
      </p>
    </section>
  );
}
