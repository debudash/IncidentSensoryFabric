import type { IdentityKeys } from "../types.ts";

export function IdentityChips({ identity }: { identity: IdentityKeys }) {
  return (
    <div className="chips">
      <span className="chip">
        <span className="chip-k">MCPTT</span>
        {identity.mcpttId}
      </span>
      <span className="chip">
        <span className="chip-k">TG</span>
        {identity.talkgroupId}
      </span>
      {identity.functionalAlias ? (
        <span className="chip chip-fa">
          <span className="chip-k">FA</span>
          {identity.functionalAlias}
        </span>
      ) : (
        <span className="chip chip-na" title="This role has no functional alias">
          FA not applicable
        </span>
      )}
    </div>
  );
}
