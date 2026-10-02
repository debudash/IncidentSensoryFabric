# Incident Sensory Fabric — Capstone

## Thesis

Agencies already bought the hard parts: MCPTT/MCX transport, radio and broadband PTT, video and air common operating pictures, and multimedia PSAP intake. Those systems do not share one identity key. When the path thins out, rich media fails and the commander has no shared view of that path next to the talkgroup.

Incident Sensory Fabric is the thin attach layer for that gap. It keys MCPTT audio, body and drone video, and NTN path state to MCPTT-ID, talkgroup, and functional alias, and it keeps a provenance trail on every joined event. The commander gets one timeline and audit-ready spoken intel. The fabric does not replace the radio, the MCX core, CAD, or the video COP.

This repository is the simulated proof. No agency, LMR, FirstNet, Softil, or satellite hardware is connected.

## USP against Assist, Exacom, and the logger

| Incumbent | What they own | What ISF does not do | The wedge |
|---|---|---|---|
| Motorola Assist | In-stack language and audio assist | Does not replace Assist or become a second assistant | Keys spoken intel to MCPTT identity across audio, video, and path state so Assist-era workflows can see one incident |
| Exacom | The logging franchise | Does not clone the logger or the evidence vault | Joins identity, modalities, and NTN path *upstream* of logging |
| HindSight-class review | Capture and after-the-fact video review | Does not become the review console | Puts the keyed timeline beside the capture path, including when video is no longer usable |

One line: attach the MC-keyed sensory fabric. Keep the stack already paid for.

## Attach go-to-market

Agencies will not rip out radios, MCX, video COP, or NG911 for a new pane. The buy is a force-enhancer:

1. Capex is already spent. A join layer clears faster than a platform swap.
2. Training and accreditation stay on the incumbent consoles.
3. The agency is not asked to pick ISF *instead of* Motorola or Axon.
4. The story for an acquirer is the same: buy the fabric, keep the franchise.

| Existing system | Stays in place | ISF would attach | ISF returns |
|---|---|---|---|
| Motorola Assist, broadband PTT, capture | PTT and in-stack assist | MCPTT-ID, talkgroup, functional alias, voice and media events | Keyed timeline and spoken intel beside Assist |
| Streamwide / FirstNet Fusion-class MCX | Transport and IWF | Session and identity semantics | Sensory UX above the pipe |
| Axon Fusus / air picture | Video and air COP | Video and air tracks as modalities | Those tracks stitched to the MC voice identity |
| Carbyne | Multimedia PSAP intake | Call and incident context | Continuity from intake to field voice to path and video |

The Capstone demo does not perform those attachments. Adapters in the packs are `sim-mcptt`, `sim-siprec`, `sim-video`, and `sim-ntn`.

## Must-prove evidence checklist

Both `scenarios/wildfire-ridge-ntn.json` and `scenarios/utility-outage-ntn.json` have to pass this list. Wildfire is the default.

| # | Proof | Where a reviewer sees it |
|---|---|---|
| 1 | Every event has MCPTT-ID and talkgroup, and a functional alias when that role has one | Chips on every timeline card and spoken-intel card. Coverage line under the timeline title. Air/UAV and dispatch say "FA not applicable" |
| 2 | Provenance: adapter, ingest time, sha256, parent ids | Provenance line on each card. Click a card, or a spoken-intel excerpt, for the drawer. Hash check reads Verified |
| 3 | Audio, video stub, and an NTN path change on one timeline | Same list: talkburst, drone or UAV stub, bodycam stub, `TERRESTRIAL` / `DEGRADED` / `NTN_NARROWBAND` |
| 4 | Degrade changes the commander cue. Narrowband text is "Video unavailable — rely on keyed talkgroup ASR." Video greys. Spoken intel stays keyed | Decision banner, lane status, grey video stamp, Spoken intel panel |
| 5 | Honesty banner cannot be dismissed | Amber strip under the header, plus the SIMULATED badge. Same strings in both packs and in the after-action JSON |

Automated coverage is `tests/identity-provenance.test.ts`. A missing identity key or a payload that no longer matches its hash fails the suite. So does a parent id that is not in the pack.

## Two-week plan status

All of this is simulated. Nothing below is a live integration.

| Days | Focus | Status in this repo |
|---|---|---|
| 1–2 | Repo, data model, wildfire JSON, timeline UI | Done |
| 3–4 | NTN path FSM, decision cue, provenance drawer, filters | Done |
| 5–6 | Spoken intel panel, after-action export | Done. Schema in [AFTER_ACTION.md](AFTER_ACTION.md) |
| 7–8 | Second scenario proving reuse | Done. Feeder 12 utility outage. Switcher in the header. Wildfire remains the default |
| 9–10 | UX polish, join and provenance tests, demo script | Done. README walks both packs and the export |
| 11–12 | Writeup, architecture, optional Starnote stub | Done. Starnote is a mock path-state reading, not hardware |
| 13–14 | Buffer, pitch alignment, demo notes | Done. [DEMO_NOTES.md](DEMO_NOTES.md) |

## Honesty constraints

> SIMULATED — Capstone demo; no live Fusion/Fusus/LEO/agency claim

> Capstone simulation only. MCPTT IDs, media, and NTN path state are synthetic. Not connected to Motorola, FirstNet, Axon, or any agency system.

Also out of scope, on purpose:

- Live MCPTT, Softil, FirstNet, or Axon connectors
- A generative chatbot or a Draft One-style report writer
- Full CAD, a logger, or an evidence vault
- Real satellite broadband PTT or video
- Any claim of 3GPP compliance certification
- Blues Starnote hardware. The UI toggle is a mock sensor shape only
