import { useState } from "react";
import { IdentityChips } from "./IdentityChips.tsx";
import {
  ADAPTER_LABEL,
  KIND_LABEL,
  formatIncidentTime,
} from "../lib/format.ts";
import type { Actor, TimelineEvent } from "../types.ts";

type Props = {
  event: TimelineEvent | null;
  events: TimelineEvent[];
  actors: Actor[];
  verified: boolean;
  reason?: string;
  onSelect: (eventId: string) => void;
};

export function ProvenanceDrawer({
  event,
  events,
  actors,
  verified,
  reason,
  onSelect,
}: Props) {
  const [copied, setCopied] = useState(false);

  if (!event) {
    return (
      <aside className="provenance" aria-label="Provenance">
        <p className="kicker">Provenance</p>
        <p className="empty">Waiting on keyed media…</p>
      </aside>
    );
  }

  const actor = actors.find((item) => item.mcpttId === event.identity.mcpttId);
  const parents = event.provenance.parentEventIds.map((id) =>
    events.find((item) => item.provenance.eventId === id),
  );

  async function copyHash() {
    if (!event) return;
    try {
      await navigator.clipboard.writeText(event.provenance.contentHash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const joined = events.filter((item) => item.identity.mcpttId === event.identity.mcpttId);
  const adapters = [...new Set(joined.map((item) => item.provenance.sourceAdapter))];

  return (
    <aside className="provenance" aria-label="Provenance">
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <p className="kicker">Provenance</p>
            <h2 id="provenance-title">{KIND_LABEL[event.kind]}</h2>
          </div>
          <span key={event.provenance.eventId} className={`verify-seal ${verified ? "is-ok" : "is-bad"}`}>
            {verified ? "VERIFIED" : "BROKEN"}
          </span>
        </div>
        <p className="mono drawer-id">{event.provenance.eventId}</p>
        <p className="drawer-time">{formatIncidentTime(event.t)} event time</p>

        <h3>Identity</h3>
        <p className="drawer-actor">
          {actor ? `${actor.callsign} · ${actor.role}` : event.identity.mcpttId}
        </p>
        <IdentityChips identity={event.identity} />
        {!event.identity.functionalAlias ? (
          <p className="stub-note">Functional alias is not applicable for this role.</p>
        ) : null}

        <h3>Trail</h3>
        <dl className="trail">
          <div>
            <dt>Source adapter</dt>
            <dd>
              <span className="mono">{event.provenance.sourceAdapter}</span>
              <span>{ADAPTER_LABEL[event.provenance.sourceAdapter]}</span>
            </dd>
          </div>
          <div>
            <dt>Ingest time</dt>
            <dd>
              <span className="mono">{event.provenance.ingestedAt}</span>
              <span>{formatIncidentTime(event.provenance.ingestedAt)}</span>
            </dd>
          </div>
          <div>
            <dt>Content hash</dt>
            <dd>
              <code>{event.provenance.contentHash}</code>
              <button type="button" className="text-btn" onClick={() => void copyHash()}>
                {copied ? "Copied" : "Copy hash"}
              </button>
            </dd>
          </div>
          <div>
            <dt>Check</dt>
            <dd>
              <span className={`verify ${verified ? "is-ok" : "is-bad"}`}>
                {verified ? "Verified" : "Hash broken"}
              </span>
              <span>
                {verified
                  ? "sha256 of the canonical payload matches this hash."
                  : (reason ?? "The stored hash does not match the payload.")}
              </span>
            </dd>
          </div>
        </dl>

        <h3>Parents</h3>
        {parents.length === 0 ? (
          <p className="stub-note">None. This event starts a chain.</p>
        ) : (
          <ul className="parent-list">
            {parents.map((parent, index) => {
              const id = event.provenance.parentEventIds[index] ?? "";
              if (!parent) {
                return (
                  <li key={id}>
                    <span className="mono">{id}</span> missing from pack
                  </li>
                );
              }
              return (
                <li key={id}>
                  <button type="button" onClick={() => onSelect(id)}>
                    <span className="mono">{id}</span>
                    <span>
                      {KIND_LABEL[parent.kind]} · {formatIncidentTime(parent.t)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <h3>Joined to this role</h3>
        <ul className="joined-keys">
          {joined.map((item) => (
            <li key={item.provenance.eventId}>
              <button type="button" onClick={() => onSelect(item.provenance.eventId)}>
                <span>{KIND_LABEL[item.kind]}</span>
                <span className="mono">{formatIncidentTime(item.t)}</span>
              </button>
            </li>
          ))}
        </ul>

        <h3>Adapter</h3>
        <div className="adapter-row">
          {adapters.map((adapter) => (
            <span key={adapter} className="adapter-badge">
              {adapter}
              <small>{ADAPTER_LABEL[adapter]}</small>
            </span>
          ))}
        </div>

        <h3>Payload</h3>
        <p className="stub-note">Hash covers canonical JSON, keys sorted.</p>
        <pre>{JSON.stringify(event.payload, null, 2)}</pre>
      </div>
    </aside>
  );
}
