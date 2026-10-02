# Incident Sensory Fabric

## Docker (local)

See [DOCKER.md](DOCKER.md).

```bash
docker compose up --build
```

Then open [http://127.0.0.1:4317](http://127.0.0.1:4317).

Phase-1 capstone demo of an identity-keyed incident timeline. It joins simulated MCPTT floor and audio, simulated ASR, bodycam and drone clip stubs, and an NTN path state machine onto one talkgroup. When the path degrades, a commander decision cue tells you the video lane is no longer trustworthy and spoken intel stays keyed.

This is a browser replay. It is not a radio, not a logger, and not a chatbot.

> SIMULATED — Capstone demo; no live Fusion/Fusus/LEO/agency claim

> Capstone simulation only. MCPTT IDs, media, and NTN path state are synthetic. Not connected to Motorola, FirstNet, Axon, or any agency system.

## Run

```bash
npm install
npm test
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

```bash
npm run build
```

Node 22 is enough. No API keys, accounts, or external services.

Two incident packs ship in `scenarios/`. Wildfire Ridge is the default. Feeder 12 Outage is the second pack and uses the same timeline. Adapters in both packs are `sim-mcptt`, `sim-siprec`, `sim-video`, and `sim-ntn`. A Starnote control in the path strip is a mock path-state reading only.

## What a reviewer can prove in the UI

1. Every timeline card shows MCPTT-ID and talkgroup. IC North and Engine 12 also show a functional alias. Air-01 and Dispatch say "FA not applicable". The timeline header counts 14/14 events with MCPTT-ID and talkgroup.
2. Every card shows source adapter, ingest time, and a short sha256. Click a card. The provenance drawer has the adapter, full ingest timestamp, full hash, parent ids, and a Verified check.
3. The same list contains audio turns, a drone stub, a bodycam stub, and NTN path changes (`TERRESTRIAL`, `DEGRADED`, `NTN_NARROWBAND`).
4. At the end of the replay the order reads "PATH NARROWBAND — video offline — trust keyed talkgroup voice/ASR", with the stored line "Video unavailable — rely on keyed talkgroup ASR." Cameras frost. Talkgroup voice stays keyed to the person, with MCPTT-ID and talkgroup on each turn.
5. The amber banner under the header is always visible and cannot be dismissed. The header badge says SIMULATED.

## Five-minute demo

The playhead opens at the end of Wildfire Ridge, so the cue is already on screen. Times below are talk-time, not incident time. The footer scenario control switches packs. Wildfire stays selected until you change it.

**0:00 — Honesty.** Read the banner: "SIMULATED — Capstone demo; no live Fusion/Fusus/LEO/agency claim." Point at the SIMULATED badge. Say that MCPTT IDs, media, and the NTN path are synthetic.

**0:30 — Keys, wildfire.** Scroll the timeline. Each card has MCPTT, TG, and either an FA or "FA not applicable". The coverage line counts every event with MCPTT-ID and talkgroup. In Identity, press `FA:ENG-12`. Only Engine 12 remains. Press Clear.

**1:10 — Who's up.** The center stage names the person, the role, and their last voice. Talkgroup voice lists the keyed excerpts, with MCPTT-ID and a short hash under the quote. Click IC North. The stage crossfades to that role. Provenance on the right opens `evt-asr-ic`: adapter `sim-siprec`, full hash, parent `evt-audio-ic`, Verified. There is no text box.

**1:50 — One timeline.** On the same list, find the IC audio turn, the Air-01 drone stub, the Engine 12 bodycam stub, and the three NTN path cards. They share `TG-FIRE-CMD`. Video entries are clip stubs.

**2:20 — Path drama.** Press Reset, then Play (30×), or press Degraded and then Narrowband. Degraded pulses amber and the order says the picture is suspect. Narrowband shifts to coral: "PATH NARROWBAND — video offline — trust keyed talkgroup voice/ASR." The stored line under it is "Video unavailable — rely on keyed talkgroup ASR." Cameras frost. Voice stays keyed, including Dispatch after the drop.

**3:10 — After-action pack.** Press After-action pack in the top rail. The note under the button says it saves the incident, path, orders, and keyed voice. The JSON is `INC-WF-RIDGE-2026-041.after-action.json`. It repeats the honesty banner, identity coverage, NTN path history, decision cues, spoken-intel excerpts, and the parent and hash chain. Schema notes are in [docs/AFTER_ACTION.md](docs/AFTER_ACTION.md).

**3:40 — Second pack.** In the footer, press Feeder 12 Outage. The incident id becomes `INC-UTIL-FEEDER-2026-018`, the talkgroup becomes `TG-UTIL-CMD`, and the playhead jumps to the end of that pack. The same banner stays up. Cards now show Duty Supervisor (`FA:SUP-NORTH`), Line 4 (`FA:LINE-04`), UAV-02, and Utility Dispatch. Filter `FA:LINE-04`, then Clear. Spoken intel is still keyed. The narrowband order is the same sentence. Press After-action pack again if you want that incident's JSON (`INC-UTIL-FEEDER-2026-018.after-action.json`).

**4:30 — Starnote stub, optional.** Press Starnote stub on the path strip. A mock Blues Starnote reading appears, marked SIMULATED, copied from the current path state. It is not a timeline event and not a live satellite. Press it again to hide it. Press Wildfire Ridge to return to the default pack.

## Tests

`npm test` runs Vitest against both packs. The suite fails if any event is missing MCPTT-ID or talkgroup, if a functional alias required by that pack's roster is absent, if a payload no longer matches its sha256, or if a parent id is not in the pack. It also checks the path sequence, the narrowband cue sentence, and the after-action pack shape.

If you edit a payload, restamp hashes before expecting the UI to load:

```bash
npx vite-node scripts/stamp-hashes.ts
```

## Docs

- [docs/CAPSTONE.md](docs/CAPSTONE.md) — thesis, USP, attach story, must-prove checklist, plan status
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — attach model this demo simulates
- [docs/AFTER_ACTION.md](docs/AFTER_ACTION.md) — export pack schema
- [docs/DEMO_NOTES.md](docs/DEMO_NOTES.md) — walkthrough notes and limitations
