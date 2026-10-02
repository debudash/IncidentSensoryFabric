# ISF architecture — attach model

The running demo uses simulated adapters only. The diagrams below are the product picture. Nothing in this repository connects to Motorola, FirstNet, Axon, Carbyne, or a satellite.

## Before: siloed sensory slices

```
┌─────────┐ ┌──────────┐ ┌───────┐ ┌────────┐ ┌─────┐
│ Assist  │ │ HindSight│ │ Fusus │ │ Fusion │ │ LEO │
│ (audio  │ │ (video/  │ │(video │ │(First  │ │slice│
│  assist)│ │  review) │ │ fuse) │ │ Net)   │ │     │
└────┬────┘ └────┬─────┘ └───┬───┘ └───┬────┘ └──┬──┘
     │           │           │         │          │
     ▼           ▼           ▼         ▼          ▼
  Separate UIs · Separate IDs · Commander overload
  NTN degrades rich media with no shared path state
```

Pain: no shared MCPTT-ID, talkgroup, or functional alias across lanes. NTN path state is invisible to the media the commander is watching. Agencies will not rip those consoles out to fix the join.

## After: identity-keyed sensory fabric

```
  Motorola MCX / FirstNet     Axon / Fusus          Carbyne
  MCPTT audio + MC meta   body / drone video     PSAP / CAD lane
           │                      │                      │
           └──────────┬───────────┴──────────┬───────────┘
                      ▼                      ▼
              ┌───────────────┐      ┌───────────────┐
              │ SIPREC adapter│      │ MC metadata   │
              │ (media path)  │      │ adapters      │
              └───────┬───────┘      └───────┬───────┘
                      └──────────┬───────────┘
                                 ▼
              ┌──────────────────────────────────────┐
              │     Incident Sensory Fabric (ISF)    │
              │  Peregrine-shaped data fabric/attach │
              │                                      │
              │  • MCPTT-ID / talkgroup / FA keys    │
              │  • Multimodal timeline join          │
              │  • NTN path state                    │
              │  • Audit provenance                  │
              └──────────────────┬───────────────────┘
                                 ▼
                    Commander: one keyed timeline
```

Existing stacks stay in place.

| Existing system | What it keeps | What ISF would attach | What ISF returns |
|---|---|---|---|
| Motorola Assist, broadband PTT, capture paths | PTT and in-stack assist | MCPTT-ID, talkgroup, functional alias, voice and media events | A keyed timeline and spoken intel beside Assist |
| Streamwide / FirstNet Fusion-class MCX | MCX transport and IWF | Session, talkgroup, and identity semantics | Sensory UX above the pipe |
| Axon Fusus / air picture | Video and air COP | Video and air tracks as modalities | Those tracks stitched to the MC voice identity |
| Carbyne | Multimedia PSAP intake | Call and incident context | Continuity from intake to field voice to path and video |

## Plug-in stack

| Layer | Role | What this repo actually runs |
|---|---|---|
| Keep the OEM consoles | Do not rip-replace radio, MCX, CAD, or video COP | Not connected |
| SIPREC-shaped media adapter | Call and media events into the fabric | `sim-siprec` |
| MC metadata adapter | MCPTT-ID, talkgroup, functional alias, floor | `sim-mcptt` |
| Video adapter | Body and drone clip references | `sim-video` |
| NTN path sensor | Bearer, RTT, bitrate, loss | `sim-ntn` |
| Optional Starnote | Tiny path-state sensor only | `src/lib/starnoteStub.ts`, UI toggle, mock reading `sim-starnote`. Not hardware. Not hashed |
| ISF | Join, path FSM, provenance, decision cue, spoken intel, after-action pack | This app |
| Surface | A side pane on consoles the agency already uses | This standalone replay |

Exacom owns the logger. The gap ISF fills is the identity-keyed multimodal and NTN join upstream of logging: an attachable wedge, not a displacement.

## NTN path FSM

Both scenario packs replay the same three states:

1. `TERRESTRIAL` — broadband video and voice.
2. `DEGRADED` — RTT and loss climb. Video is unreliable. Spoken intel stays keyed.
3. `NTN_NARROWBAND` — video bearer down. The commander cue is: "Video unavailable — rely on keyed talkgroup ASR."

Decision cues are events. The narrowband cue's parent is the narrowband path event. `contentHash` is sha256 of the canonical payload, so a changed transcript or a changed RTT breaks verification.

## Identity

Every event has:

- `mcpttId`
- `talkgroupId`
- `functionalAlias` when that role has one

Wildfire aliases: `FA:IC-NORTH`, `FA:ENG-12` on `TG-FIRE-CMD`. Air-01 and Dispatch have none.

Utility outage aliases: `FA:SUP-NORTH`, `FA:LINE-04` on `TG-UTIL-CMD`. UAV-02 and Utility Dispatch have none.

The same timeline, filter, provenance drawer, spoken-intel panel, and export run on both packs. Wildfire is the default.

## What this is not

ISF does not replace Assist, HindSight, an APX or LEO radio, Fusion, Fusus, or Carbyne. This repository does not claim a live multi-vendor integration or a 3GPP certification. Standards language in the pitch means the product wants to speak MCPTT identity and recording direction. The code is the simulated proof of the join.
