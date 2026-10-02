import { useEffect, useMemo, useRef, useState } from "react";
import { DecisionCue } from "./components/DecisionCue.tsx";
import { IdentityFilter } from "./components/IdentityFilter.tsx";
import { IncidentHeader } from "./components/IncidentHeader.tsx";
import { PathState } from "./components/PathState.tsx";
import { PlaybackBar } from "./components/PlaybackBar.tsx";
import { ProvenanceDrawer } from "./components/ProvenanceDrawer.tsx";
import { ScenarioError } from "./components/ScenarioError.tsx";
import { FusionStage } from "./components/FusionStage.tsx";
import { StarnotePanel } from "./components/StarnotePanel.tsx";
import { Timeline } from "./components/Timeline.tsx";
import { buildAfterActionPack, downloadJson } from "./lib/export.ts";
import {
  EMPTY_FILTER,
  filterEvents,
  isFilterActive,
  type IdentityFilter as IdentitySelection,
} from "./lib/join.ts";
import {
  currentCue,
  currentPathEvent,
  eventsAt,
  jumpTargets,
  pathStateName,
  videoLaneFor,
} from "./lib/playback.ts";
import { verifyEventProvenance } from "./lib/provenance.ts";
import {
  collectScenarioErrors,
  scenarioEndMs,
  scenarioStartMs,
  scenarios,
  type ScenarioId,
} from "./lib/scenario.ts";
import { readStarnoteStub } from "./lib/starnoteStub.ts";
import { HONESTY_BANNER, HONESTY_DETAIL } from "./types.ts";

const DEFAULT_SCENARIO: ScenarioId = "wildfire-ridge-ntn";

export default function App() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>(DEFAULT_SCENARIO);
  const active = scenarios[scenarioId];
  const start = scenarioStartMs(active);
  const end = scenarioEndMs(active);
  const errors = useMemo(() => collectScenarioErrors(active), [active]);
  const playheadRef = useRef(end);
  const [playhead, setPlayhead] = useState(end);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [filter, setFilter] = useState<IdentitySelection>(EMPTY_FILTER);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starnoteOn, setStarnoteOn] = useState(false);

  const checks = useMemo(() => {
    const map = new Map<string, ReturnType<typeof verifyEventProvenance>>();
    for (const event of active.events) {
      map.set(event.provenance.eventId, verifyEventProvenance(event));
    }
    return map;
  }, [active]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      const next = Math.min(end, playheadRef.current + delta * speed);
      playheadRef.current = next;
      setPlayhead(next);
      if (next >= end) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, end]);

  function seek(ms: number) {
    const next = Math.min(end, Math.max(start, ms));
    playheadRef.current = next;
    setPlayhead(next);
  }

  function selectScenario(id: ScenarioId) {
    if (id === scenarioId) return;
    const nextEnd = scenarioEndMs(scenarios[id]);
    setPlaying(false);
    setFilter(EMPTY_FILTER);
    setSelectedId(null);
    playheadRef.current = nextEnd;
    setPlayhead(nextEnd);
    setScenarioId(id);
  }

  if (errors.length > 0) {
    return (
      <ScenarioError
        errors={errors}
        scenarioId={scenarioId}
        onScenario={selectScenario}
      />
    );
  }

  function togglePlay() {
    if (!playing && playheadRef.current >= end) {
      seek(start);
    }
    setPlaying((value) => !value);
  }

  function step() {
    const next = active.events.find((event) => Date.parse(event.t) > playheadRef.current + 1);
    seek(next ? Date.parse(next.t) : end);
    setPlaying(false);
  }

  function exportPack() {
    const observedAt = new Date(playhead).toISOString();
    const pack = buildAfterActionPack(active, new Date().toISOString(), {
      starnoteStub: starnoteOn ? readStarnoteStub(currentPathEvent(active.events, playhead), observedAt) : null,
    });
    downloadJson(`${active.incident.id}.after-action.json`, pack);
  }

  const matched = filterEvents(active.events, filter);
  const visible = eventsAt(matched, playhead);
  const pathEvent = currentPathEvent(active.events, playhead);
  const pathName = pathStateName(pathEvent);
  const lane = videoLaneFor(pathName);
  const cue = currentCue(active.events, playhead);
  const picked = active.events.find((event) => event.provenance.eventId === selectedId) ?? null;
  const inWindow = visible.find((event) => event.provenance.eventId === selectedId);
  const sameRole = picked
    ? [...visible].reverse().find(
        (event) =>
          event.identity.mcpttId === picked.identity.mcpttId &&
          (event.kind === "asr_snippet" || event.kind === "audio_turn" || event.kind === "video_clip"),
      ) ?? [...visible].reverse().find((event) => event.identity.mcpttId === picked.identity.mcpttId)
    : undefined;
  const selected =
    inWindow ??
    sameRole ??
    [...visible].reverse().find((event) => event.kind === "asr_snippet") ??
    visible[visible.length - 1] ??
    null;
  const jumps = jumpTargets(active.events, end);
  const verified = new Map([...checks.entries()].map(([id, check]) => [id, check.ok]));
  const starnote = readStarnoteStub(pathEvent, new Date(playhead).toISOString());

  const focusId = selected?.identity.mcpttId ?? null;
  const tone = (pathName ?? "TERRESTRIAL").toLowerCase();

  return (
    <div className={`shell tone-${tone}`}>
      <div className="top-stack">
        <IncidentHeader
          incidentId={active.incident.id}
          title={active.incident.title}
          location={active.incident.location}
          talkgroupId={active.incident.talkgroupId}
          playheadMs={playhead}
          pathEvent={pathEvent}
          pathState={pathName}
          onExport={exportPack}
        />
        <div className="honesty" role="status">
          <strong>{HONESTY_BANNER}</strong>
          <span>{HONESTY_DETAIL}</span>
        </div>
      </div>

      <PathState
        events={active.events}
        playheadMs={playhead}
        starnoteOn={starnoteOn}
        onToggleStarnote={() => setStarnoteOn((value) => !value)}
        onJump={(ms) => {
          setPlaying(false);
          seek(ms);
        }}
      />

      <div className="glass">
        <div className="col col-timeline">
          <IdentityFilter
            actors={active.actors}
            events={active.events}
            filter={filter}
            onChange={setFilter}
          />
          {isFilterActive(filter) && matched.length === 0 ? (
            <section className="panel timeline-panel">
              <h2>KEYED</h2>
              <p className="empty">Waiting on keyed media…</p>
            </section>
          ) : (
            <Timeline
              incidentEvents={active.events}
              visibleEvents={visible}
              actors={active.actors}
              videoLane={lane}
              verified={verified}
              selectedId={selected?.provenance.eventId ?? null}
              focusId={focusId}
              playheadMs={playhead}
              onSelect={setSelectedId}
            />
          )}
        </div>
        <div className="col col-stage">
          <DecisionCue cue={cue} lane={lane} talkgroupId={active.incident.talkgroupId} />
          <FusionStage
            events={visible}
            actors={active.actors}
            selectedId={selected?.provenance.eventId ?? null}
            playheadMs={playhead}
            lane={lane}
            onSelect={setSelectedId}
          />
        </div>
        <div className="col col-prov">
          {starnoteOn ? <StarnotePanel reading={starnote} /> : null}
          <ProvenanceDrawer
            event={selected}
            events={visible}
            actors={active.actors}
            verified={selected ? (checks.get(selected.provenance.eventId)?.ok ?? false) : false}
            reason={selected ? checks.get(selected.provenance.eventId)?.reason : undefined}
            onSelect={setSelectedId}
          />
        </div>
      </div>

      <PlaybackBar
        playheadMs={playhead}
        startMs={start}
        endMs={end}
        playing={playing}
        speed={speed}
        jumps={jumps}
        scenarioId={scenarioId}
        onSeek={(ms) => {
          setPlaying(false);
          seek(ms);
        }}
        onToggle={togglePlay}
        onStep={step}
        onReset={() => {
          setPlaying(false);
          seek(start);
        }}
        onSpeed={setSpeed}
        onJump={(ms) => {
          setPlaying(false);
          seek(ms);
        }}
        onScenario={selectScenario}
      />
    </div>
  );
}
