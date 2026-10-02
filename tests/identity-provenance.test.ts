import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { AFTER_ACTION_SCHEMA, buildAfterActionPack } from "../src/lib/export.ts";
import {
  aliasPolicyErrors,
  filterEvents,
  identityCoverage,
  missingIdentityKeys,
  requireIdentityKeys,
} from "../src/lib/join.ts";
import { currentCue, currentPathEvent, pathStateName, videoLaneFor } from "../src/lib/playback.ts";
import {
  canonicalJson,
  contentHash,
  sha256Hex,
  verifyChain,
  verifyEventProvenance,
} from "../src/lib/provenance.ts";
import { collectScenarioErrors, scenario, scenarios, type ScenarioId } from "../src/lib/scenario.ts";
import { readStarnoteStub, STARNOTE_ADAPTER } from "../src/lib/starnoteStub.ts";
import { HONESTY_BANNER, SOURCE_ADAPTERS } from "../src/types.ts";
import type { Scenario, TimelineEvent } from "../src/types.ts";

function nodeSha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const NARROWBAND_CUE = "Video unavailable — rely on keyed talkgroup ASR.";

function assertMustProve(pack: Scenario) {
  expect(pack.incident.honestyBanner).toBe(HONESTY_BANNER);
  expect(collectScenarioErrors(pack)).toEqual([]);
  expect(verifyChain(pack.events).ok).toBe(true);
  expect(aliasPolicyErrors(pack.events, pack.actors)).toEqual([]);

  const coverage = identityCoverage(pack.events);
  expect(coverage.withMcpttId).toBe(coverage.total);
  expect(coverage.withTalkgroup).toBe(coverage.total);

  for (const event of pack.events) {
    expect(event.identity.talkgroupId).toBe(pack.incident.talkgroupId);
    expect(verifyEventProvenance(event).ok).toBe(true);
    expect(contentHash(event.payload)).toBe(nodeSha256(canonicalJson(event.payload)));
    requireIdentityKeys(event);
  }

  const kinds = new Set(pack.events.map((event) => event.kind));
  expect(kinds.has("audio_turn")).toBe(true);
  expect(kinds.has("asr_snippet")).toBe(true);
  expect(kinds.has("video_clip")).toBe(true);
  expect(kinds.has("ntn_path")).toBe(true);

  const degraded = pack.events.find(
    (event) => event.kind === "ntn_path" && event.payload.state === "DEGRADED",
  )!;
  const before = Date.parse(degraded.t) - 1;
  expect(currentCue(pack.events, before)).toBeNull();
  expect(videoLaneFor(pathStateName(currentPathEvent(pack.events, before)))).toBe("clear");

  const caution = currentCue(pack.events, Date.parse(degraded.t) + 1500);
  expect(caution?.payload.triggeredByState).toBe("DEGRADED");
  expect(videoLaneFor(pathStateName(currentPathEvent(pack.events, Date.parse(caution!.t))))).toBe(
    "unreliable",
  );

  const end = Date.parse(pack.events[pack.events.length - 1]!.t);
  const critical = currentCue(pack.events, end);
  expect(critical?.payload.message).toBe(NARROWBAND_CUE);
  expect(critical?.payload.spokenIntel).toBe("remains_keyed");
  expect(videoLaneFor(pathStateName(currentPathEvent(pack.events, end)))).toBe("unavailable");
  const parent = pack.events.find((event) =>
    critical?.provenance.parentEventIds.includes(event.provenance.eventId),
  );
  expect(parent?.kind).toBe("ntn_path");
  expect(parent?.payload.state).toBe("NTN_NARROWBAND");

  const packExport = buildAfterActionPack(pack, "2026-10-02T12:00:00.000Z");
  expect(packExport.schema).toBe(AFTER_ACTION_SCHEMA);
  expect(packExport.honestyBanner).toBe(HONESTY_BANNER);
  expect(packExport.provenance.broken).toBe(0);
  expect(packExport.provenance.chain).toHaveLength(pack.events.length);
  expect(packExport.events).toHaveLength(pack.events.length);
  expect(packExport.ntnPathHistory.map((item) => item.state)).toEqual([
    "TERRESTRIAL",
    "DEGRADED",
    "NTN_NARROWBAND",
  ]);
  expect(packExport.decisionCues.some((cue) => cue.message === NARROWBAND_CUE)).toBe(true);
  expect(packExport.spokenIntel.length).toBe(
    pack.events.filter((event) => event.kind === "asr_snippet").length,
  );
  expect(packExport.spokenIntel.every((excerpt) => excerpt.simulatedAsr)).toBe(true);
  expect(packExport.spokenIntel.every((excerpt) => excerpt.identity.mcpttId && excerpt.identity.talkgroupId)).toBe(
    true,
  );
  expect(packExport.starnoteStub).toBeNull();
  for (const event of packExport.events) {
    expect(event.identity.mcpttId.trim().length).toBeGreaterThan(0);
    expect(event.identity.talkgroupId.trim().length).toBeGreaterThan(0);
    expect(event.provenance.contentHash).toHaveLength(64);
  }
}

describe("sha256 and canonical payload hashes", () => {
  it("matches known SHA-256 vectors and Node crypto", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(sha256Hex(NARROWBAND_CUE)).toBe(nodeSha256(NARROWBAND_CUE));
  });
});

describe("both scenario packs", () => {
  it.each(Object.keys(scenarios) as ScenarioId[])("%s meets the five must-prove checks", (id) => {
    assertMustProve(scenarios[id]);
  });

  it("fails when an MCPTT-ID or talkgroup is missing", () => {
    const event = scenario.events[0]!;
    const noMcptt: TimelineEvent = {
      ...event,
      identity: { ...event.identity, mcpttId: " " },
    };
    const noTalkgroup: TimelineEvent = {
      ...event,
      identity: { ...event.identity, talkgroupId: "" },
    };

    expect(missingIdentityKeys(noMcptt)).toContain("mcpttId");
    expect(missingIdentityKeys(noTalkgroup)).toContain("talkgroupId");
    expect(() => requireIdentityKeys(noMcptt)).toThrow(/mcpttId/);
    expect(missingIdentityKeys(event)).toEqual([]);
  });

  it("fails when a content hash does not match the payload", () => {
    for (const pack of Object.values(scenarios)) {
      const event = pack.events.find((item) => item.kind === "asr_snippet")!;
      const tamperedPayload: TimelineEvent = {
        ...event,
        payload: { ...event.payload, text: "tampered transcript" },
      };
      const replacedHash: TimelineEvent = {
        ...event,
        provenance: { ...event.provenance, contentHash: "ab".repeat(32) },
      };
      expect(verifyEventProvenance(tamperedPayload).ok).toBe(false);
      expect(verifyEventProvenance(tamperedPayload).reason).toMatch(/does not match/);
      expect(verifyEventProvenance(replacedHash).ok).toBe(false);
      expect(verifyEventProvenance(event).ok).toBe(true);
    }
  });

  it("fails when a parent id is not in the pack", () => {
    const event = scenario.events[1]!;
    const broken: TimelineEvent = {
      ...event,
      provenance: { ...event.provenance, parentEventIds: ["evt-missing"] },
    };
    const result = verifyChain([scenario.events[0]!, broken]);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/parent evt-missing/);
  });
});

describe("wildfire identity join", () => {
  it("keeps Engine 12 on FA:ENG-12", () => {
    const engine = filterEvents(scenario.events, {
      mcpttIds: [],
      talkgroupIds: [],
      functionalAliases: ["FA:ENG-12"],
    });
    expect(engine.length).toBeGreaterThan(0);
    expect(engine.every((event) => event.identity.functionalAlias === "FA:ENG-12")).toBe(true);
    expect(engine.every((event) => event.identity.mcpttId === "mcptt:user:e12-lt")).toBe(true);
  });
});

describe("utility outage identity join", () => {
  it("keeps Line 4 on FA:LINE-04 and uses a different talkgroup", () => {
    const pack = scenarios["utility-outage-ntn"];
    expect(pack.incident.id).toBe("INC-UTIL-FEEDER-2026-018");
    expect(pack.incident.talkgroupId).toBe("TG-UTIL-CMD");
    const line = filterEvents(pack.events, {
      mcpttIds: [],
      talkgroupIds: [],
      functionalAliases: ["FA:LINE-04"],
    });
    expect(line.length).toBeGreaterThan(0);
    expect(line.every((event) => event.identity.mcpttId === "mcptt:user:line-04")).toBe(true);
    expect(line.every((event) => event.identity.talkgroupId === "TG-UTIL-CMD")).toBe(true);
  });
});

describe("starnote stub", () => {
  it("is a mock path reading and not a scenario adapter", () => {
    expect(SOURCE_ADAPTERS).not.toContain(STARNOTE_ADAPTER);
    const path = scenario.events.find((event) => event.kind === "ntn_path")!;
    const reading = readStarnoteStub(path, path.t);
    expect(reading.mode).toBe("mock");
    expect(reading.simulated).toBe(true);
    expect(reading.sourceAdapter).toBe(STARNOTE_ADAPTER);
    expect(reading.state).toBe("TERRESTRIAL");
    const exported = buildAfterActionPack(scenario, "2026-10-02T12:00:00.000Z", {
      starnoteStub: reading,
    });
    expect(exported.starnoteStub?.sensor).toBe("blues-starnote");
    expect(exported.events.some((event) => event.provenance.sourceAdapter === STARNOTE_ADAPTER)).toBe(
      false,
    );
  });
});
