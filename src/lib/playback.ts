import type { PathStateName, TimelineEvent, VideoLane } from "../types.ts";
import { PATH_STATES } from "../types.ts";

export function eventTimeMs(event: TimelineEvent): number {
  return Date.parse(event.t);
}

/** True while the playhead sits inside a simulated PTT burst. */
export function pttWindow(event: TimelineEvent, playheadMs: number): boolean {
  if (event.kind !== "audio_turn") return false;
  const start = eventTimeMs(event);
  const duration = typeof event.payload.durationMs === "number" ? event.payload.durationMs : 0;
  return playheadMs >= start && playheadMs < start + Math.max(duration, 1);
}

export function eventsAt(events: TimelineEvent[], playheadMs: number): TimelineEvent[] {
  return events.filter((event) => eventTimeMs(event) <= playheadMs);
}

export function currentPathEvent(
  events: TimelineEvent[],
  playheadMs: number,
): TimelineEvent | null {
  let current: TimelineEvent | null = null;
  for (const event of events) {
    if (event.kind !== "ntn_path") continue;
    if (eventTimeMs(event) <= playheadMs) current = event;
  }
  return current;
}

export function currentCue(events: TimelineEvent[], playheadMs: number): TimelineEvent | null {
  let current: TimelineEvent | null = null;
  for (const event of events) {
    if (event.kind !== "decision_cue") continue;
    if (eventTimeMs(event) <= playheadMs) current = event;
  }
  return current;
}

export function pathStateName(event: TimelineEvent | null): PathStateName | null {
  if (!event) return null;
  const state = event.payload.state;
  if (typeof state === "string" && (PATH_STATES as readonly string[]).includes(state)) {
    return state as PathStateName;
  }
  return null;
}

export function videoLaneFor(state: PathStateName | null): VideoLane {
  if (state === "NTN_NARROWBAND") return "unavailable";
  if (state === "DEGRADED") return "unreliable";
  return "clear";
}

export type JumpTarget = {
  id: string;
  label: string;
  ms: number;
};

/** Replay jumps. Terrestrial stops just before the fade so the cue is not up yet. */
export function jumpTargets(events: TimelineEvent[], endMs: number): JumpTarget[] {
  const degraded = events.find(
    (event) => event.kind === "ntn_path" && event.payload.state === "DEGRADED",
  );
  const degradedCue = events.find(
    (event) => event.kind === "decision_cue" && event.payload.triggeredByState === "DEGRADED",
  );
  const narrowCue = events.find(
    (event) =>
      event.kind === "decision_cue" && event.payload.triggeredByState === "NTN_NARROWBAND",
  );

  const targets: JumpTarget[] = [];
  if (degraded) {
    targets.push({
      id: "terrestrial",
      label: "Terrestrial",
      ms: eventTimeMs(degraded) - 1,
    });
  }
  if (degradedCue) {
    targets.push({
      id: "degraded",
      label: "Degraded",
      ms: eventTimeMs(degradedCue),
    });
  }
  targets.push({
    id: "ntn",
      label: "Narrowband",
    ms: narrowCue ? Math.max(eventTimeMs(narrowCue), endMs) : endMs,
  });
  return targets;
}
