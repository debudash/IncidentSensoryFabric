import { SCENARIO_LABEL, SCENARIO_ORDER, type ScenarioId } from "../lib/scenario.ts";
import { HONESTY_BANNER, HONESTY_DETAIL } from "../types.ts";

type Props = {
  errors: string[];
  scenarioId: ScenarioId;
  onScenario: (id: ScenarioId) => void;
};

export function ScenarioError({ errors, scenarioId, onScenario }: Props) {
  return (
    <main className="error-screen">
      <p className="sim-pill">SIMULATED · CAPSTONE DEMO</p>
      <div className="scenario-switch" role="group" aria-label="Scenario">
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
      <p className="honesty-banner" role="status">
        {HONESTY_BANNER}
      </p>
      <h1>Scenario pack failed checks</h1>
      <p>{HONESTY_DETAIL}</p>
      <p>The incident file is not being shown as a timeline because identity or provenance checks failed.</p>
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </main>
  );
}
