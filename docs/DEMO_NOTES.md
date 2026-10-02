# Demo notes

Recorded walkthrough for the Capstone replay at [http://127.0.0.1:4317](http://127.0.0.1:4317). Wildfire Ridge is the default. Feeder 12 Outage is the second pack. Both stay 100% simulated.

## Before you start

```bash
npm install
npm test
npm run dev
```

Or, with Docker:

```bash
docker compose up --build
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317). The playhead opens at the end of the selected pack, so the narrowband decision cue is already on screen. Playback speed defaults to 30×.

## Walkthrough

**1. Honesty.** The amber banner reads "SIMULATED — Capstone demo; no live Fusion/Fusus/LEO/agency claim" and cannot be dismissed. The header badge says SIMULATED. The detail line says MCPTT IDs, media, and NTN path state are synthetic and not connected to Motorola, FirstNet, Axon, or any agency system.

**2. Wildfire keys.** Incident `INC-WF-RIDGE-2026-041`, talkgroup `TG-FIRE-CMD`. Every card shows MCPTT-ID and talkgroup. IC North is `FA:IC-NORTH`. Engine 12 is `FA:ENG-12`. Air-01 and Dispatch say "FA not applicable". The timeline header counts 14/14. In Identity, press `FA:ENG-12`, then Clear.

**3. Who's up.** The center names the person on the air, their role, and the last thing they said. Talkgroup voice keeps confidence, MCPTT-ID, talkgroup, functional alias when the roster has one, and a short sha256. Click IC North. The stage joins that role. Provenance focuses `evt-asr-ic`: adapter `sim-siprec`, full hash, parent `evt-audio-ic`, Verified. There is no text box and no generated narrative.

**4. One timeline.** On the same list: IC audio turn, Air-01 drone stub, Engine 12 bodycam stub, and three NTN path cards (`TERRESTRIAL`, `DEGRADED`, `NTN_NARROWBAND`). They share `TG-FIRE-CMD`. Video entries are clip stubs, not live video.

**5. Path drama.** Press Reset, then Play, or press Degraded and then Narrowband. Degraded pulses amber. Narrowband is coral. The order reads "PATH NARROWBAND — video offline — trust keyed talkgroup voice/ASR." Under it, the stored line is still "Video unavailable — rely on keyed talkgroup ASR." Cameras frost. Voice stays keyed, including Dispatch after the drop.

**6. After-action pack.** Press After-action pack in the top rail. The line under the button says it holds the incident, path, orders, and keyed voice. The download is `INC-WF-RIDGE-2026-041.after-action.json`, schema `isf.after-action.v1`. It contains incident metadata, identity coverage, NTN path history, decision cues, spoken-intel excerpts, the parent and hash chain, and the full events. `starnoteStub` is `null` unless the Starnote panel was on. Schema notes are in [AFTER_ACTION.md](AFTER_ACTION.md).

**7. Second pack.** In the footer, press Feeder 12 Outage. The incident becomes `INC-UTIL-FEEDER-2026-018`, Feeder 12 Outage — North Ridge, talkgroup `TG-UTIL-CMD`. The playhead jumps to the end of that pack. The same banner stays up. Cards show Duty Supervisor (`FA:SUP-NORTH`), Line 4 (`FA:LINE-04`), UAV-02, and Utility Dispatch. Filter `FA:LINE-04`, then Clear. Spoken intel stays keyed. The narrowband cue is the same sentence. Export again for `INC-UTIL-FEEDER-2026-018.after-action.json`.

**8. Starnote stub, optional.** Press Starnote stub on the path strip. A mock Blues Starnote card appears, marked SIMULATED, copied from the current path state (`sim-starnote`). It is not a timeline event, not hashed, and not hardware. Press the button again to hide it. Press Wildfire Ridge to return to the default pack.

**9. Provenance.** Click any timeline card. The right column shows adapter, full ingest timestamp, full sha256, parent ids, and a Verified seal. A payload edit without restamping hashes fails that check and `npm test`.

## Visual refresh

A supervisor should read four things before the chrome: who is up, what media joined that person, whether the path is healthy, and that this is simulated. The opening playhead is already in the narrowband moment. The center stage names the person and their last voice; cameras on that role light up, and everyone else sits near half opacity. Path moves Terrestrial → Degraded (amber pulse) → Narrowband (coral, cameras frost). After-action pack is the export. Wildfire Ridge and Feeder 12 are two incidents on the same glass. `SIMULATED · CAPSTONE DEMO` stays on the rail. Technical ids and hashes stay on the turns and in provenance, under the callsign.

## Screenshots and recording

Supervisor pass (artifact files, not committed):

- `supervisor_opening_narrowband.png` — opening moment: Dispatch up, path Narrowband, simulated pill.
- `supervisor_ic_north_join.png` — IC North selected; voice joined; other cameras dim.
- `supervisor_path_degraded.png` — same role, path Degraded, picture suspect.
- `supervisor_narrowband_frost.png` — Narrowband, cameras offline, IC North still up.
- `supervisor_ic_join_path_degrade_export.mp4` — select IC North, walk Terrestrial → Degraded → Narrowband, export the after-action pack.

Earlier frames:

- `wildfire_narrowband_cue.png` — Wildfire Ridge default end state with the narrowband cue.
- `spoken_intel_provenance.png` — Spoken intel row with confidence, identity keys, adapter, hash, and the provenance drawer.
- `feeder12_end_state.png` — Feeder 12 at NTN narrowband: scenario switcher, honesty banner, decision cue.
- `starnote_stub.png` — Starnote stub on, reading the current path state.
- `isf_both_scenarios_spoken_intel_export.mp4` — reload on Wildfire, open spoken-intel provenance, switch to Feeder 12 (Duty Supervisor excerpt), open the Starnote stub, export, return to Wildfire.

## Known limitations

- Everything is simulated. There is no live MCPTT, SIPREC, bodycam, drone, FirstNet, or satellite path.
- Spoken intel is pre-authored ASR snippets on the timeline. It does not transcribe audio and does not write an after-action narrative.
- Video is a grey stub once the lane is unreliable or unavailable. There is no media player.
- Starnote is a mock reading derived from the current `ntn_path` event. Adapter id `sim-starnote` is not a hashed source adapter. Turning the panel on does not add a timeline event. Export includes the reading only while the panel is on; otherwise `starnoteStub` is `null`.
- The after-action file is a JSON download in the browser. It is not signed, not stored, and not an evidence vault.
- Only two packs ship: `scenarios/wildfire-ridge-ntn.json` and `scenarios/utility-outage-ntn.json`. Wildfire remains the default.
- No Draft One chatbot, no live OEM connectors, and no Softil or FirstNet product claims.
- Hash changes require `npx vite-node scripts/stamp-hashes.ts` before the UI will load the edited pack.
