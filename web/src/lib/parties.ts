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
  | "IPP"
  | "AP"
  | "MML"
  | "PNP"
  | "PPP-TOWER"
  | "SIC"
  | "TTPP"
  | "Independent";

export interface PartyMeta {
  id: PartyId;
  display: string;
  shortDisplay: string;
  color: string;
  textOnColor: "light" | "dark";
  flag: string;
  /** Election symbol allotted by the ECGB / ECP. Used in candidate-list tables
   *  alongside the party name. Independents have a per-candidate symbol so
   *  this stays generic. */
  electionSymbol?: string;
  /** Emoji icon for the election symbol, rendered next to the symbol text. */
  electionSymbolIcon?: string;
  /** Official ECP / ECGB allotted-symbol code from the 2026 Form-33 sheet. */
  electionSymbolCode?: number;
  /** Number of 2026 candidates filed under this party, post-scrutiny snapshot
   *  per parties_2026_symbols.csv. Undefined for parties that did not field a
   *  2026 candidate. */
  candidates2026?: number;
}

// Maps a canonical party id to the flag asset path. Files live under
// web/public/flags/ — placeholder colour tiles for now; swap in real flag
// PNGs by replacing the file in place, no code change needed.
const FLAG: Record<PartyId, string> = {
  PPP: "/flags/ppp.png",
  "PML-N": "/flags/pml-n.png",
  PTI: "/flags/pti.png",
  MWM: "/flags/mwm.png",
  ITP: "/flags/itp.png",
  "JUI-F": "/flags/jui-f.png",
  JI: "/flags/ji.png",
  "BNF-N": "/flags/bnf-n.png",
  "PML-Q": "/flags/pml-q.png",
  PML: "/flags/pml.png",
  MQM: "/flags/mqm.png",
  APML: "/flags/apml.png",
  PAT: "/flags/pat.png",
  PSP: "/flags/psp.png",
  AWP: "/flags/awp.png",
  TLP: "/flags/tlp.png",
  ANP: "/flags/anp.png",
  IPP: "/flags/ipp.png",
  AP: "/flags/ap.png",
  MML: "/flags/mml.png",
  PNP: "/flags/pnp.png",
  "PPP-TOWER": "/flags/ppp-tower.png",
  SIC: "/flags/sic.png",
  TTPP: "/flags/ttpp.png",
  Independent: "/flags/independent.png",
};

// Election symbols allotted by the Election Commission of Gilgit-Baltistan
// (ECGB) for the 2026 Assembly election. Source:
// data/raw/research/parties_2026_symbols_official.json
// Sheet: https://ecgb.gov.pk/storage/attachments/P60sv18v3lIzEcgBl3XooTUChhAKMXyqLj7h2FwZ.jpg
const ELECTION_SYMBOL: Partial<Record<PartyId, string>> = {
  PPP: "Arrow",
  "PML-N": "Tiger",
  PTI: "Cricket Bat",
  MWM: "Tent",
  ITP: "Two Swords",
  "JUI-F": "Book",
  JI: "Scale",
  "BNF-N": "Crescent",
  "PML-Q": "Tractor",
  PML: "Tractor",
  MQM: "Kite",
  APML: "Eagle",
  PAT: "Star",
  PSP: "Dolphin",
  AWP: "Bulb",
  TLP: "Crane",
  ANP: "Ladder",
  IPP: "Eagle",
  AP: "Clock",
  MML: "Chair",
  PNP: "Railway Engine",
  "PPP-TOWER": "Tower",
  SIC: "Horse",
  TTPP: "Revolver",
  Independent: "Variable",
};

// Official ECP symbol allocation codes (where assigned). Used for cross-
// referencing with the ECGB Form-33 sheet.
const ELECTION_SYMBOL_CODE: Partial<Record<PartyId, number>> = {
  PPP: 12,
  "PML-N": 284,
  IPP: 93,
  PML: 292,
  "PML-Q": 292,
  ITP: 307,
  PNP: 216,
  "JUI-F": 31,
  MWM: 282,
  JI: 232,
  MQM: 159,
  AWP: 40,
  AP: 60,
  MML: 55,
  TTPP: 218,
  SIC: 137,
  TLP: 71,
  "PPP-TOWER": 291,
  // Per the official ECGB symbol sheet ("Antkhabi Nishanat"). Codes 161
  // and 259 belong to ANP and PAT respectively; code 162 (Lantern) is
  // allocated to Tehreek Jawanan Pakistan, not ANP.
  ANP: 161,
  PAT: 259,
};

// Visual icon for each election symbol. Unicode emoji is used so the icons
// render correctly on every device without any image asset to ship. Where no
// single emoji captures the symbol cleanly (Variable for independents) we
// fall back to a ballot-box motif.
const ELECTION_SYMBOL_ICON: Partial<Record<PartyId, string>> = {
  PPP: "🏹",          // Arrow (bow and arrow proxy)
  "PML-N": "🐅",       // Tiger
  PTI: "🏏",          // Cricket Bat (PTI's recognised ballot symbol)
  MWM: "⛺",          // Tent
  ITP: "⚔️",          // Two Swords
  "JUI-F": "📖",       // Book
  JI: "⚖️",           // Scale
  "BNF-N": "🌙",       // Crescent
  "PML-Q": "🚜",       // Tractor (shared registered symbol with PML)
  PML: "🚜",          // Tractor
  MQM: "🪁",          // Kite
  APML: "🦅",         // Eagle
  PAT: "⭐",          // Star (Pakistan Awami Tehreek)
  PSP: "🐬",          // Dolphin
  AWP: "💡",          // Bulb
  TLP: "🏗️",          // Crane
  ANP: "🪜",          // Ladder (ANP — per ECGB symbol code 161)
  IPP: "🦅",          // Eagle
  AP: "🕰️",           // Wall Clock
  MML: "🪑",          // Chair
  PNP: "🚂",          // Railway Engine
  "PPP-TOWER": "🗼",   // Tower
  SIC: "🐎",          // Horse
  TTPP: "🔫",         // Revolver
  // Independent intentionally has no shared icon. Per the ECGB spec, each
  // independent candidate is allotted an individual symbol from the
  // independent-candidate sheet; mapping them all to one mark would be
  // misleading. The candidate-field table renders this as "per candidate".
};

const CANDIDATES_2026: Partial<Record<PartyId, number>> = {
  PPP: 23,
  "PML-N": 22,
  IPP: 15,
  PML: 11,
  ITP: 10,
  PNP: 10,
  "JUI-F": 9,
  MWM: 7,
  JI: 6,
  MQM: 6,
  AWP: 4,
  ANP: 1,
  AP: 1,
  MML: 1,
  "PML-Q": 1,
  "PPP-TOWER": 1,
  SIC: 1,
  TTPP: 1,
  TLP: 1,
  Independent: 272,
};

// Tailwind-aligned hex values (slate/red/emerald/etc 600 ish, muted).
// `flag` lives in the FLAG map and is merged in by `getParty()`, so the
// per-party entries below carry only display + colour metadata.
const PALETTE: Record<PartyId, Omit<PartyMeta, "id" | "flag">> = {
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
  IPP: {
    display: "Istehkam-e-Pakistan Party",
    shortDisplay: "IPP",
    color: "#0369a1", // sky-700
    textOnColor: "light",
  },
  AP: {
    display: "Awaam Pakistan",
    shortDisplay: "AP",
    color: "#475569", // slate-600
    textOnColor: "light",
  },
  MML: {
    display: "Markazi Muslim League",
    shortDisplay: "MML",
    color: "#16a34a", // green-600
    textOnColor: "light",
  },
  PNP: {
    display: "Pakistan Nazriyati Party",
    shortDisplay: "PNP",
    color: "#7e22ce", // purple-700
    textOnColor: "light",
  },
  "PPP-TOWER": {
    display: "PPP Tower Group",
    shortDisplay: "PPP-T",
    color: "#9f1239", // rose-800
    textOnColor: "light",
  },
  SIC: {
    display: "Sunni Ittehad Council",
    shortDisplay: "SIC",
    color: "#15803d", // green-700
    textOnColor: "light",
  },
  TTPP: {
    display: "Tehreek Tahafuz Pakistan Party",
    shortDisplay: "TTPP",
    color: "#7c2d12", // orange-900
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
    return {
      id: id as PartyId,
      ...meta,
      flag: FLAG[id as PartyId] ?? "/flags/independent.png",
      electionSymbol: ELECTION_SYMBOL[id as PartyId],
      electionSymbolIcon: ELECTION_SYMBOL_ICON[id as PartyId],
      electionSymbolCode: ELECTION_SYMBOL_CODE[id as PartyId],
      candidates2026: CANDIDATES_2026[id as PartyId],
    };
  }
  return {
    id: "Independent",
    display: id,
    shortDisplay: id,
    color: "#94a3b8", // slate-400
    textOnColor: "light",
    flag: "/flags/independent.png",
  };
}

export const PARTY_IDS = Object.keys(PALETTE) as PartyId[];

/**
 * Returns the 2026 candidate-field roster sorted by candidate count
 * descending. Independents (272 candidates in 2026) lead the list because
 * they are numerically the largest group in this election cycle — about
 * 67 percent of the field. Hiding that at the bottom would understate the
 * fragmentation of the slate.
 */
export function getCandidateField2026(): PartyMeta[] {
  return PARTY_IDS.filter((id) => CANDIDATES_2026[id] !== undefined)
    .sort((a, b) => (CANDIDATES_2026[b] ?? 0) - (CANDIDATES_2026[a] ?? 0))
    .map((id) => getParty(id));
}
