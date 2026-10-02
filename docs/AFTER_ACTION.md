# After-action pack

`Export after-action` downloads `{incidentId}.after-action.json`. The file is a simulation record. It is not an evidence vault and not a live recording export.

Schema id: `isf.after-action.v1`

## Top-level fields

| Field | Meaning |
|---|---|
| `schema` | Always `isf.after-action.v1` |
| `honestyBanner` | Required capstone banner |
| `honestyDetail` | Synthetic-data sentence |
| `incident` | Incident id, title, location, talkgroup, start time |
| `exportedAt` | ISO time of the download |
| `note` | States that hashes cover payloads and that spoken intel is not a generated narrative |
| `identityCoverage` | Counts of events with MCPTT-ID, talkgroup, and functional alias |
| `ntnPathHistory` | Each `ntn_path` event: state, bearer, RTT, bitrate, loss, identity, provenance |
| `decisionCues` | Each `decision_cue`: message, video lane, spoken-intel flag, triggering path state, identity, provenance |
| `spokenIntel` | Each `asr_snippet`: text, confidence, `simulatedAsr`, identity, provenance |
| `starnoteStub` | `null`, or a mock Blues Starnote reading if that panel was on at export. Not hashed |
| `provenance.chain` | Event id, kind, time, parents, adapter, ingest time, content hash, identity |
| `provenance.checks` | Per-event hash verification |
| `events` | Full timeline events |

`contentHash` is the sha256 of the canonical JSON of that event's `payload` only. Changing the transcript or the RTT without restamping the hash makes verification fail.

Spoken-intel excerpts are the same simulated ASR events already on the timeline. The pack does not write a new narrative.
