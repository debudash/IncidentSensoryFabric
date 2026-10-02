import type { TimelineEvent } from "../types.ts";

/**
 * Blues Starnote stub.
 *
 * In the product picture, Starnote is an optional tiny NTN path-state sensor:
 * it would report bearer, RTT, and bitrate into the fabric. It is not a radio,
 * not a video bearer, and not a talkgroup.
 *
 * This module does not talk to hardware. `readStarnoteStub` copies the current
 * simulated path event into a mock reading so a reviewer can see the adapter
 * shape. The reading is not a timeline event and is not covered by content hashes.
 */
export const STARNOTE_SENSOR = "blues-starnote";
export const STARNOTE_ADAPTER = "sim-starnote";

export type StarnoteReading = {
  sensor: typeof STARNOTE_SENSOR;
  sourceAdapter: typeof STARNOTE_ADAPTER;
  mode: "mock";
  simulated: true;
  observedAt: string;
  state: string;
  bearer: string;
  rttMs: number | null;
  bitrateKbps: number | null;
  note: string;
};

export function readStarnoteStub(
  pathEvent: TimelineEvent | null,
  observedAt: string,
): StarnoteReading {
  const payload = pathEvent?.payload ?? {};
  const state = typeof payload.state === "string" ? payload.state : "UNKNOWN";
  const bearer = typeof payload.bearer === "string" ? payload.bearer : "unknown";
  const rttMs = typeof payload.rttMs === "number" ? payload.rttMs : null;
  const bitrateKbps = typeof payload.bitrateKbps === "number" ? payload.bitrateKbps : null;

  return {
    sensor: STARNOTE_SENSOR,
    sourceAdapter: STARNOTE_ADAPTER,
    mode: "mock",
    simulated: true,
    observedAt,
    state,
    bearer,
    rttMs,
    bitrateKbps,
    note: "Mock Blues Starnote reading. Optional NTN path-state sensor only. Not a radio, not a live satellite, and not part of the event hash chain.",
  };
}
