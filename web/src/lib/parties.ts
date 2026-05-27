// Party colour palette. Muted Tailwind shades, not pure brand colours, to
// signal analytical neutrality. Match the canonical party ids in
// data/clean/parties.csv.

export type PartyId =
  | "PPP"
  | "PML-N"
  | "PTI"
  | "MWM"
  | "ITP"
  | "JUI-F"
  | "JI"
  | "BNF-N"
  | "PML-Q"
  | "PML"
  | "MQM"
  | "APML"
  | "PAT"
  | "PSP"
  | "AWP"
  | "TLP"
  | "ANP"
  | "Independent";

export interface PartyMeta {
  id: PartyId;
  display: string;
  shortDisplay: string;
  color: string;
  textOnColor: "light" | "dark";
}

// Tailwind-aligned hex values (slate/red/emerald/etc 600 ish, muted).
const PALETTE: Record<PartyId, Omit<PartyMeta, "id">> = {
  PPP: {
    display: "Pakistan Peoples Party",
    shortDisplay: "PPP",
    color: "#b91c1c", // red-700
    textOnColor: "light",
  },
  "PML-N": {
    display: "Pakistan Muslim League (N)",
    shortDisplay: "PML-N",
    color: "#15803d", // green-700
    textOnColor: "light",
  },
  PTI: {
    display: "Pakistan Tehreek-e-Insaf",
    shortDisplay: "PTI",
    color: "#c2410c", // orange-700
    textOnColor: "light",
  },
  MWM: {
    display: "Majlis Wahdat-e-Muslimeen",
    shortDisplay: "MWM",
    color: "#1d4ed8", // blue-700
    textOnColor: "light",
  },
  ITP: {
    display: "Islami Tehreek Pakistan",
    shortDisplay: "ITP",
    color: "#6d28d9", // violet-700
    textOnColor: "light",
  },
  "JUI-F": {
    display: "Jamiat Ulema-e-Islam (F)",
    shortDisplay: "JUI-F",
    color: "#0f766e", // teal-700
    textOnColor: "light",
  },
  JI: {
    display: "Jamaat-e-Islami",
    shortDisplay: "JI",
    color: "#166534", // green-800
    textOnColor: "light",
  },
  "BNF-N": {
    display: "Balawaristan National Front (Naji)",
    shortDisplay: "BNF-N",
    color: "#7c3aed", // violet-600
    textOnColor: "light",
  },
  "PML-Q": {
    display: "Pakistan Muslim League (Q)",
    shortDisplay: "PML-Q",
    color: "#a16207", // yellow-700
    textOnColor: "light",
  },
  PML: {
    display: "Pakistan Muslim League (faction unspecified)",
    shortDisplay: "PML",
    color: "#854d0e", // yellow-800
    textOnColor: "light",
  },
  MQM: {
    display: "Muttahida Qaumi Movement",
    shortDisplay: "MQM",
    color: "#0e7490", // cyan-700
    textOnColor: "light",
  },
  APML: {
    display: "All Pakistan Muslim League",
    shortDisplay: "APML",
    color: "#9333ea", // purple-600
    textOnColor: "light",
  },
  PAT: {
    display: "Pakistan Awami Tehreek",
    shortDisplay: "PAT",
    color: "#be185d", // pink-700
    textOnColor: "light",
  },
  PSP: {
    display: "Pak Sarzameen Party",
    shortDisplay: "PSP",
    color: "#3b82f6", // blue-500
    textOnColor: "light",
  },
  AWP: {
    display: "Awami Workers Party",
    shortDisplay: "AWP",
    color: "#dc2626", // red-600
    textOnColor: "light",
  },
  TLP: {
    display: "Tehreek-e-Labbaik Pakistan",
    shortDisplay: "TLP",
    color: "#facc15", // yellow-400
    textOnColor: "dark",
  },
  ANP: {
    display: "Awami National Party",
    shortDisplay: "ANP",
    color: "#dc2626", // red-600
    textOnColor: "light",
  },
  Independent: {
    display: "Independent",
    shortDisplay: "Ind.",
    color: "#64748b", // slate-500
    textOnColor: "light",
  },
};

export function getParty(id: string): PartyMeta {
  const meta = PALETTE[id as PartyId];
  if (meta) {
    return { id: id as PartyId, ...meta };
  }
  return {
    id: "Independent",
    display: id,
    shortDisplay: id,
    color: "#94a3b8", // slate-400
    textOnColor: "light",
  };
}

export const PARTY_IDS = Object.keys(PALETTE) as PartyId[];
