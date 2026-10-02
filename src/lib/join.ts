import type { Actor, IdentityKeys, TimelineEvent } from "../types.ts";

export type IdentityFilter = {
  mcpttIds: string[];
  talkgroupIds: string[];
  functionalAliases: string[];
};

export const EMPTY_FILTER: IdentityFilter = {
  mcpttIds: [],
  talkgroupIds: [],
  functionalAliases: [],
};

export function isFilterActive(filter: IdentityFilter): boolean {
  return (
    filter.mcpttIds.length > 0 ||
    filter.talkgroupIds.length > 0 ||
    filter.functionalAliases.length > 0
  );
}

/** MCPTT-ID and talkgroup are required on every event. FA is checked separately. */
export function missingIdentityKeys(event: TimelineEvent): string[] {
  const missing: string[] = [];
  if (!event.identity?.mcpttId?.trim()) missing.push("mcpttId");
  if (!event.identity?.talkgroupId?.trim()) missing.push("talkgroupId");
  return missing;
}

export function requireIdentityKeys(event: TimelineEvent): void {
  const missing = missingIdentityKeys(event);
  if (missing.length > 0) {
    const id = event.provenance?.eventId ?? "(no event id)";
    throw new Error(`${id} missing identity keys: ${missing.join(", ")}`);
  }
}

export function joinKey(identity: IdentityKeys): string {
  return [identity.mcpttId, identity.talkgroupId, identity.functionalAlias ?? ""].join("|");
}

export function eventMatchesFilter(event: TimelineEvent, filter: IdentityFilter): boolean {
  if (filter.mcpttIds.length > 0 && !filter.mcpttIds.includes(event.identity.mcpttId)) {
    return false;
  }
  if (
    filter.talkgroupIds.length > 0 &&
    !filter.talkgroupIds.includes(event.identity.talkgroupId)
  ) {
    return false;
  }
  if (filter.functionalAliases.length > 0) {
    const alias = event.identity.functionalAlias;
    if (!alias || !filter.functionalAliases.includes(alias)) return false;
  }
  return true;
}

export function filterEvents(events: TimelineEvent[], filter: IdentityFilter): TimelineEvent[] {
  return events.filter((event) => eventMatchesFilter(event, filter));
}

export function identityCoverage(events: TimelineEvent[]) {
  return {
    total: events.length,
    withMcpttId: events.filter((event) => Boolean(event.identity?.mcpttId?.trim())).length,
    withTalkgroup: events.filter((event) => Boolean(event.identity?.talkgroupId?.trim())).length,
    withFunctionalAlias: events.filter((event) => Boolean(event.identity?.functionalAlias?.trim()))
      .length,
  };
}

/**
 * Actors that carry a functional alias must have that alias on every one of
 * their events. Actors with a null alias must not invent one.
 */
export function aliasPolicyErrors(events: TimelineEvent[], actors: Actor[]): string[] {
  const byId = new Map(actors.map((actor) => [actor.mcpttId, actor]));
  const errors: string[] = [];
  for (const event of events) {
    const actor = byId.get(event.identity.mcpttId);
    const id = event.provenance?.eventId ?? "(no event id)";
    if (!actor) {
      errors.push(`${id} uses unknown MCPTT-ID ${event.identity.mcpttId}`);
      continue;
    }
    if (actor.functionalAlias) {
      if (event.identity.functionalAlias !== actor.functionalAlias) {
        errors.push(`${id} is missing functional alias ${actor.functionalAlias}`);
      }
    } else if (event.identity.functionalAlias) {
      errors.push(`${id} has a functional alias but ${actor.callsign} does not use one`);
    }
  }
  return errors;
}
