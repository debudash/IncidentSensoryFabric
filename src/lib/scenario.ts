import utilityRaw from "../../scenarios/utility-outage-ntn.json" with { type: "json" };
import wildfireRaw from "../../scenarios/wildfire-ridge-ntn.json" with { type: "json" };
import { aliasPolicyErrors, missingIdentityKeys } from "./join.ts";
import { verifyChain } from "./provenance.ts";
import {
  EVENT_KINDS,
  HONESTY_BANNER,
  HONESTY_DETAIL,
  SOURCE_ADAPTERS,
  type Scenario,
  type TimelineEvent,
} from "../types.ts";

export const SCENARIO_ORDER = ["wildfire-ridge-ntn", "utility-outage-ntn"] as const;

export type ScenarioId = (typeof SCENARIO_ORDER)[number];

export const SCENARIO_LABEL: Record<ScenarioId, string> = {
  "wildfire-ridge-ntn": "Wildfire Ridge",
  "utility-outage-ntn": "Feeder 12 Outage",
};

function prepare(raw: Scenario): Scenario {
  const events = [...raw.events].sort(
    (a, b) => a.t.localeCompare(b.t) || a.provenance.eventId.localeCompare(b.provenance.eventId),
  );
  return { ...raw, events };
}

export const scenarios: Record<ScenarioId, Scenario> = {
  "wildfire-ridge-ntn": prepare(wildfireRaw as Scenario),
  "utility-outage-ntn": prepare(utilityRaw as Scenario),
};

/** Default pack. Wildfire stays the pack a cold open shows. */
export const scenario: Scenario = scenarios["wildfire-ridge-ntn"];

export function isScenarioId(value: string): value is ScenarioId {
  return (SCENARIO_ORDER as readonly string[]).includes(value);
}

export function scenarioStartMs(pack: Scenario): number {
  return Date.parse(pack.incident.startedAt);
}

export function scenarioEndMs(pack: Scenario): number {
  const last = pack.events[pack.events.length - 1];
  return Date.parse(last?.t ?? pack.incident.startedAt);
}

export const startMs = scenarioStartMs(scenario);
export const endMs = scenarioEndMs(scenario);

const KIND_SET = new Set<string>(EVENT_KINDS);
const ADAPTER_SET = new Set<string>(SOURCE_ADAPTERS);

export function collectScenarioErrors(pack: Scenario): string[] {
  const errors: string[] = [];
  if (!pack.events.length) errors.push("Scenario has no events.");
  if (pack.incident.honestyBanner !== HONESTY_BANNER) {
    errors.push("Incident honesty banner does not match the required capstone text.");
  }
  if (pack.incident.honestyDetail !== HONESTY_DETAIL) {
    errors.push("Incident honesty detail does not match the required capstone text.");
  }

  for (const event of pack.events) {
    const id = event.provenance?.eventId || "(missing id)";
    if (!KIND_SET.has(event.kind)) errors.push(`${id} has unknown kind ${event.kind}`);
    if (!ADAPTER_SET.has(event.provenance?.sourceAdapter)) {
      errors.push(`${id} has unknown source adapter`);
    }
    if (Number.isNaN(Date.parse(event.t))) errors.push(`${id} has an invalid event time`);
    for (const key of missingIdentityKeys(event)) {
      errors.push(`${id} is missing ${key}`);
    }
    const ingested = Date.parse(event.provenance?.ingestedAt ?? "");
    const occurred = Date.parse(event.t);
    if (!Number.isNaN(ingested) && !Number.isNaN(occurred) && ingested < occurred) {
      errors.push(`${id} was ingested before it occurred`);
    }
  }

  errors.push(...aliasPolicyErrors(pack.events, pack.actors));

  const chain = verifyChain(pack.events);
  if (!chain.ok && chain.reason) errors.push(chain.reason);

  const kinds = new Set(pack.events.map((event) => event.kind));
  for (const required of ["audio_turn", "asr_snippet", "video_clip", "ntn_path", "decision_cue"] as const) {
    if (!kinds.has(required)) errors.push(`Scenario is missing a ${required} event`);
  }

  const states = pack.events
    .filter((event) => event.kind === "ntn_path")
    .map((event) => event.payload.state);
  if (states.join(",") !== "TERRESTRIAL,DEGRADED,NTN_NARROWBAND") {
    errors.push("NTN path must run TERRESTRIAL, then DEGRADED, then NTN_NARROWBAND");
  }

  return errors;
}

export function eventById(events: TimelineEvent[], eventId: string) {
  return events.find((event) => event.provenance.eventId === eventId);
}
