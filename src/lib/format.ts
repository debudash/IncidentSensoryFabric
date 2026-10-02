import type { EventKind, SourceAdapter, TimelineEvent } from "../types.ts";

export const ADAPTER_LABEL: Record<SourceAdapter, string> = {
  "sim-mcptt": "Simulated MCPTT floor control",
  "sim-siprec": "Simulated SIPREC media",
  "sim-video": "Simulated video adapter",
  "sim-ntn": "Simulated NTN path sensor",
};

export const KIND_LABEL: Record<EventKind, string> = {
  floor: "Floor",
  audio_turn: "Voice",
  asr_snippet: "Voice text",
  video_clip: "Camera",
  ntn_path: "Path",
  decision_cue: "Order",
};

export function pathLabel(state: string): string {
  if (state === "NTN_NARROWBAND") return "Narrowband";
  if (state === "DEGRADED") return "Degraded";
  if (state === "TERRESTRIAL") return "Terrestrial";
  return state;
}

export function formatIncidentTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss} Z`;
}

export function formatClock(ms: number): string {
  return formatIncidentTime(new Date(ms).toISOString());
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  const seconds = ms / 1000;
  return seconds >= 10 ? `${Math.round(seconds)}s` : `${seconds.toFixed(1)}s`;
}

export function formatBitrate(kbps: number): string {
  if (!Number.isFinite(kbps)) return "—";
  if (kbps >= 1000) {
    const mbps = kbps / 1000;
    const text = mbps % 1 === 0 ? mbps.toFixed(0) : mbps.toFixed(1);
    return `${text} Mb/s`;
  }
  return `${Math.round(kbps)} kb/s`;
}

export function formatRtt(ms: number): string {
  if (!Number.isFinite(ms)) return "—";
  return `${Math.round(ms).toLocaleString("en-US")} ms`;
}

function text(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value : "";
}

function numberAt(payload: Record<string, unknown>, key: string): number {
  const value = payload[key];
  return typeof value === "number" ? value : 0;
}

export function eventSummary(event: TimelineEvent): string {
  const payload = event.payload;
  switch (event.kind) {
    case "floor":
      return `Floor granted · ${text(payload, "priority") || "routine"} · ${formatDuration(numberAt(payload, "durationMs"))}`;
    case "audio_turn":
      return text(payload, "transcriptPreview") || text(payload, "label") || "Talkburst";
    case "asr_snippet":
      return text(payload, "text");
    case "video_clip":
      return `${text(payload, "label") || "Clip"} · ${text(payload, "source") || "video"} stub · ${formatDuration(numberAt(payload, "durationMs"))}`;
    case "ntn_path": {
      const loss = typeof payload.lossPct === "number" ? ` · ${payload.lossPct}% loss` : "";
      return `${text(payload, "state")} · ${formatRtt(numberAt(payload, "rttMs"))} RTT · ${formatBitrate(numberAt(payload, "bitrateKbps"))}${loss}`;
    }
    case "decision_cue":
      return text(payload, "message");
    default:
      return "";
  }
}

export function payloadNumber(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  return typeof value === "number" ? value : null;
}

export function payloadText(payload: Record<string, unknown>, key: string): string {
  return text(payload, key);
}
