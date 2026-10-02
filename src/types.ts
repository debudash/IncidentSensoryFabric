export const HONESTY_BANNER =
  "SIMULATED — Capstone demo; no live Fusion/Fusus/LEO/agency claim";

export const HONESTY_DETAIL =
  "Capstone simulation only. MCPTT IDs, media, and NTN path state are synthetic. Not connected to Motorola, FirstNet, Axon, or any agency system.";

export const SOURCE_ADAPTERS = [
  "sim-mcptt",
  "sim-siprec",
  "sim-video",
  "sim-ntn",
] as const;

export type SourceAdapter = (typeof SOURCE_ADAPTERS)[number];

export const EVENT_KINDS = [
  "audio_turn",
  "asr_snippet",
  "video_clip",
  "ntn_path",
  "floor",
  "decision_cue",
] as const;

export type EventKind = (typeof EVENT_KINDS)[number];

export const PATH_STATES = ["TERRESTRIAL", "DEGRADED", "NTN_NARROWBAND"] as const;

export type PathStateName = (typeof PATH_STATES)[number];

export type VideoLane = "clear" | "unreliable" | "unavailable";

export type IdentityKeys = {
  mcpttId: string;
  talkgroupId: string;
  functionalAlias?: string;
};

export type Provenance = {
  eventId: string;
  parentEventIds: string[];
  sourceAdapter: SourceAdapter;
  ingestedAt: string;
  contentHash: string;
};

export type TimelineEvent = {
  t: string;
  kind: EventKind;
  identity: IdentityKeys;
  provenance: Provenance;
  payload: Record<string, unknown>;
};

export type Actor = {
  mcpttId: string;
  callsign: string;
  role: string;
  functionalAlias: string | null;
};

export type Incident = {
  id: string;
  title: string;
  summary: string;
  location: string;
  talkgroupId: string;
  startedAt: string;
  phase: number;
  honestyBanner: string;
  honestyDetail: string;
};

export type Scenario = {
  incident: Incident;
  actors: Actor[];
  events: TimelineEvent[];
};
