import { identityCoverage } from "./join.ts";
import { verifyEventProvenance } from "./provenance.ts";
import type { StarnoteReading } from "./starnoteStub.ts";
import type { Scenario, TimelineEvent } from "../types.ts";
import { HONESTY_BANNER, HONESTY_DETAIL } from "../types.ts";

export const AFTER_ACTION_SCHEMA = "isf.after-action.v1";

function text(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value : "";
}

function numberOrNull(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  return typeof value === "number" ? value : null;
}

function provenanceSlice(event: TimelineEvent) {
  return {
    sourceAdapter: event.provenance.sourceAdapter,
    ingestedAt: event.provenance.ingestedAt,
    contentHash: event.provenance.contentHash,
    parentEventIds: event.provenance.parentEventIds,
  };
}

export function buildAfterActionPack(
  scenario: Scenario,
  exportedAt: string,
  options?: { starnoteStub?: StarnoteReading | null },
) {
  const checks = scenario.events.map((event) => {
    const result = verifyEventProvenance(event);
    return {
      eventId: event.provenance.eventId,
      ok: result.ok,
      reason: result.reason ?? null,
      contentHash: event.provenance.contentHash,
    };
  });

  const ntnPathHistory = scenario.events
    .filter((event) => event.kind === "ntn_path")
    .map((event) => ({
      eventId: event.provenance.eventId,
      t: event.t,
      state: text(event.payload, "state"),
      bearer: text(event.payload, "bearer"),
      rttMs: numberOrNull(event.payload, "rttMs"),
      bitrateKbps: numberOrNull(event.payload, "bitrateKbps"),
      lossPct: numberOrNull(event.payload, "lossPct"),
      identity: event.identity,
      provenance: provenanceSlice(event),
    }));

  const decisionCues = scenario.events
    .filter((event) => event.kind === "decision_cue")
    .map((event) => ({
      eventId: event.provenance.eventId,
      t: event.t,
      severity: text(event.payload, "severity"),
      title: text(event.payload, "title"),
      message: text(event.payload, "message"),
      videoLane: text(event.payload, "videoLane"),
      spokenIntel: text(event.payload, "spokenIntel"),
      triggeredByState: text(event.payload, "triggeredByState"),
      identity: event.identity,
      provenance: provenanceSlice(event),
    }));

  const spokenIntel = scenario.events
    .filter((event) => event.kind === "asr_snippet")
    .map((event) => ({
      eventId: event.provenance.eventId,
      t: event.t,
      text: text(event.payload, "text"),
      confidence: numberOrNull(event.payload, "confidence"),
      simulatedAsr: event.payload.simulatedAsr === true,
      language: text(event.payload, "language"),
      identity: event.identity,
      provenance: provenanceSlice(event),
    }));

  return {
    schema: AFTER_ACTION_SCHEMA,
    honestyBanner: HONESTY_BANNER,
    honestyDetail: HONESTY_DETAIL,
    incident: scenario.incident,
    exportedAt,
    note: "After-action pack from the capstone simulation. Each content hash is sha256 of that event payload. Spoken intel excerpts are the simulated ASR events, not a generated narrative. This is not an evidence vault and not a live recording export.",
    identityCoverage: identityCoverage(scenario.events),
    ntnPathHistory,
    decisionCues,
    spokenIntel,
    starnoteStub: options?.starnoteStub ?? null,
    provenance: {
      verified: checks.filter((check) => check.ok).length,
      broken: checks.filter((check) => !check.ok).length,
      checks,
      chain: scenario.events.map((event) => ({
        eventId: event.provenance.eventId,
        kind: event.kind,
        t: event.t,
        parentEventIds: event.provenance.parentEventIds,
        sourceAdapter: event.provenance.sourceAdapter,
        ingestedAt: event.provenance.ingestedAt,
        contentHash: event.provenance.contentHash,
        identity: event.identity,
      })),
    },
    events: scenario.events,
  };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
