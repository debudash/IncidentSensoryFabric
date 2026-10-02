import { readFileSync, writeFileSync } from "node:fs";
import { contentHash } from "../src/lib/provenance.ts";

const files = ["wildfire-ridge-ntn.json", "utility-outage-ntn.json"];

for (const name of files) {
  const path = new URL(`../scenarios/${name}`, import.meta.url);
  const scenario = JSON.parse(readFileSync(path, "utf8")) as {
    events: { provenance: { contentHash: string }; payload: Record<string, unknown> }[];
  };
  for (const event of scenario.events) {
    event.provenance.contentHash = contentHash(event.payload);
  }
  writeFileSync(path, `${JSON.stringify(scenario, null, 2)}\n`);
  console.log(`stamped ${scenario.events.length} events in ${name}`);
}
