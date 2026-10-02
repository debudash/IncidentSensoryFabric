import type { Actor, TimelineEvent } from "../types.ts";
import {
  EMPTY_FILTER,
  isFilterActive,
  type IdentityFilter,
} from "../lib/join.ts";

type Props = {
  actors: Actor[];
  events: TimelineEvent[];
  filter: IdentityFilter;
  onChange: (filter: IdentityFilter) => void;
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function countBy(events: TimelineEvent[], pick: (event: TimelineEvent) => string | undefined) {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = pick(event);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function IdentityFilter({ actors, events, filter, onChange }: Props) {
  const mcpttCounts = countBy(events, (event) => event.identity.mcpttId);
  const tgCounts = countBy(events, (event) => event.identity.talkgroupId);
  const faCounts = countBy(events, (event) => event.identity.functionalAlias);
  const talkgroups = [...tgCounts.keys()];
  const aliases = actors
    .map((actor) => actor.functionalAlias)
    .filter((alias): alias is string => Boolean(alias));

  return (
    <aside className="panel filters" aria-label="Identity filters">
      <div className="panel-head">
        <h2>Role</h2>
        <button
          type="button"
          className="text-btn"
          onClick={() => onChange(EMPTY_FILTER)}
          disabled={!isFilterActive(filter)}
        >
          Clear
        </button>
      </div>
      <p className="panel-note">Narrow the turns. Path stays on the incident.</p>

      <h3>Talkgroup</h3>
      <div className="filter-list">
        {talkgroups.map((talkgroup) => (
          <button
            key={talkgroup}
            type="button"
            className="filter-chip"
            aria-pressed={filter.talkgroupIds.includes(talkgroup)}
            onClick={() =>
              onChange({ ...filter, talkgroupIds: toggle(filter.talkgroupIds, talkgroup) })
            }
          >
            <span>{talkgroup}</span>
            <span className="count">{tgCounts.get(talkgroup)}</span>
          </button>
        ))}
      </div>

      <h3>Who</h3>
      <div className="filter-list">
        {actors.map((actor) => (
          <button
            key={actor.mcpttId}
            type="button"
            className="filter-chip"
            aria-pressed={filter.mcpttIds.includes(actor.mcpttId)}
            onClick={() =>
              onChange({ ...filter, mcpttIds: toggle(filter.mcpttIds, actor.mcpttId) })
            }
          >
            <span>
              <strong>{actor.callsign}</strong>
              <small>{actor.mcpttId}</small>
            </span>
            <span className="count">{mcpttCounts.get(actor.mcpttId) ?? 0}</span>
          </button>
        ))}
      </div>

      <h3>Role alias</h3>
      <div className="filter-list">
        {aliases.map((alias) => (
          <button
            key={alias}
            type="button"
            className="filter-chip"
            aria-pressed={filter.functionalAliases.includes(alias)}
            onClick={() =>
              onChange({
                ...filter,
                functionalAliases: toggle(filter.functionalAliases, alias),
              })
            }
          >
            <span>{alias}</span>
            <span className="count">{faCounts.get(alias) ?? 0}</span>
          </button>
        ))}
      </div>
      <p className="panel-foot">
        Role alias on{" "}
        {actors
          .filter((actor) => actor.functionalAlias)
          .map((actor) => actor.callsign)
          .join(", ") || "nobody"}
        . None on{" "}
        {actors
          .filter((actor) => !actor.functionalAlias)
          .map((actor) => actor.callsign)
          .join(", ") || "nobody"}
        .
      </p>
    </aside>
  );
}
