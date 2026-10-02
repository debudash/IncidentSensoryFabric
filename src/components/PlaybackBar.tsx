import type { JumpTarget } from "../lib/playback.ts";
import { SCENARIO_LABEL, SCENARIO_ORDER, type ScenarioId } from "../lib/scenario.ts";
import { formatClock } from "../lib/format.ts";

type Props = {
  playheadMs: number;
  startMs: number;
  endMs: number;
  playing: boolean;
  speed: number;
  jumps: JumpTarget[];
  onSeek: (ms: number) => void;
  onToggle: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeed: (speed: number) => void;
  onJump: (ms: number) => void;
  scenarioId: ScenarioId;
  onScenario: (id: ScenarioId) => void;
};

const SPEEDS = [1, 30, 60];

export function PlaybackBar({
  playheadMs,
  startMs,
  endMs,
  playing,
  speed,
  jumps,
  onSeek,
  onToggle,
  onStep,
  onReset,
  onSpeed,
  onJump,
  scenarioId,
  onScenario,
}: Props) {
  return (
    <div className="playback">
      <div className="playback-row">
        <div className="playback-transport" role="group" aria-label="Replay transport">
          <button type="button" onClick={onReset}>
            Reset
          </button>
          <button type="button" className="primary" onClick={onToggle}>
            {playing ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={onStep}>
            Step
          </button>
        </div>
        <p className="playback-clock">
          <span className="mono">{formatClock(playheadMs)}</span>
          <span className="muted"> / {formatClock(endMs)}</span>
        </p>
        <label className="scrub">
          <span className="visually-hidden">Incident playhead</span>
          <input
            type="range"
            min={startMs}
            max={endMs}
            step={100}
            value={Math.min(endMs, Math.max(startMs, playheadMs))}
            onChange={(change) => onSeek(Number(change.target.value))}
          />
        </label>
        <div className="speed" role="group" aria-label="Replay speed">
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={speed === value}
              onClick={() => onSpeed(value)}
            >
              {value}×
            </button>
          ))}
        </div>
      </div>
      <div className="playback-row">
        <div className="scenario-switch" role="group" aria-label="Incident">
          {SCENARIO_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === scenarioId}
              onClick={() => onScenario(id)}
            >
              {SCENARIO_LABEL[id]}
            </button>
          ))}
        </div>
        <div className="jumps" role="group" aria-label="Jump playhead">
          <span className="jump-k">Path</span>
          {jumps.map((jump) => (
            <button key={jump.id} type="button" onClick={() => onJump(jump.ms)}>
              {jump.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
