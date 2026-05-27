import { useQuery } from "@tanstack/react-query";

export interface Constituency {
  constituency_id: string;
  name: string;
  district: string;
}

export interface ElectionMeta {
  year: number;
  poll_date: string;
  ruling_party_centre: string;
  registered_voters: number | null;
  turnout_pct: number | null;
  polling_stations: number | null;
}

export interface CandidateRun {
  constituency_id: string;
  election_year: number;
  rank: number;
  candidate_id: string;
  candidate_name: string;
  party: string;
  votes: number | null;
  vote_share_pct: number | null;
  vote_share_pct_imputed: boolean;
  won: boolean;
}

export interface ConstituencySummary {
  constituency_id: string;
  election_year: number;
  district: string | null;
  registered_voters: number | null;
  votes_cast: number | null;
  turnout_pct: number | null;
  margin: number | null;
}

export interface HoldoutPrediction {
  constituency_id: string;
  election_year: number;
  candidate_id: string;
  candidate_name: string;
  party: string;
  pred_proba: number;
  ci_lower_80: number;
  ci_upper_80: number;
  actual_won: number;
}

export interface ModelReport {
  model_version: string;
  training_years: number[];
  test_year: number;
  best_c: number;
  cv_brier_train: number;
  train_brier: number;
  test_brier: number;
  test_constituency_accuracy: number;
  test_constituencies_total: number;
  test_constituencies_correct: number;
  baseline_2020_accuracy: number | null;
  baseline_2020_correct: number | null;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/**
 * The Python exporter occasionally serialises numeric columns (notably
 * election_year) as strings. Coerce here once so every consumer receives a
 * consistent number and can compare with `=== 2020` without surprises.
 *
 * Concrete interfaces such as `ConstituencySummary` don't carry an index
 * signature, so we can't constrain T to `Record<string, unknown>` without
 * losing inference at the call site. Take T unconstrained and do the field
 * access through a permissive view.
 */
function coerceNumericFields<T>(rows: T[], fields: (keyof T)[]): T[] {
  return rows.map((row) => {
    const next = { ...row };
    const view = next as Record<string, unknown>;
    for (const f of fields) {
      const key = f as string;
      const v = view[key];
      if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
        view[key] = Number(v);
      }
    }
    return next;
  });
}

export function useConstituencies() {
  return useQuery({
    queryKey: ["constituencies"],
    queryFn: () => fetchJson<Constituency[]>("/data/constituencies.json"),
  });
}

export function useElections() {
  return useQuery({
    queryKey: ["elections"],
    queryFn: async () => {
      const rows = await fetchJson<ElectionMeta[]>("/data/elections.json");
      return coerceNumericFields(rows, [
        "year",
        "registered_voters",
        "turnout_pct",
        "polling_stations",
      ]);
    },
  });
}

export function useCandidateRuns() {
  return useQuery({
    queryKey: ["candidate_runs"],
    queryFn: async () => {
      const rows = await fetchJson<CandidateRun[]>("/data/candidate_runs.json");
      return coerceNumericFields(rows, [
        "election_year",
        "rank",
        "votes",
        "vote_share_pct",
      ]);
    },
  });
}

export function useConstituencySummary() {
  return useQuery({
    queryKey: ["constituency_summary"],
    queryFn: async () => {
      const rows = await fetchJson<ConstituencySummary[]>(
        "/data/constituency_election_summary.json",
      );
      return coerceNumericFields(rows, [
        "election_year",
        "registered_voters",
        "votes_cast",
        "turnout_pct",
        "margin",
      ]);
    },
  });
}

export function useHoldoutPredictions() {
  return useQuery({
    queryKey: ["holdout_predictions"],
    queryFn: async () => {
      const rows = await fetchJson<HoldoutPrediction[]>(
        "/data/predictions_2020_holdout.json",
      );
      return coerceNumericFields(rows, [
        "election_year",
        "pred_proba",
        "ci_lower_80",
        "ci_upper_80",
        "actual_won",
      ]);
    },
  });
}

export function useModelReport() {
  return useQuery({
    queryKey: ["model_report"],
    queryFn: () => fetchJson<ModelReport>("/data/training_report.json"),
  });
}

export interface KnownNominee2026 {
  constituency_id: string;
  candidate_name: string;
  party: string;
  role_notes: string | null;
  source: string;
}

/**
 * Confirmed 2026 nominees we have verified from public sources (ECGB Form-33
 * notifications and the research-pack news track). This is a partial roster;
 * many constituencies will only carry party-level info until the full
 * official nominee sheet ships. Where a confirmed name exists we surface it
 * prominently so the dashboard does not imply historical candidates are the
 * 2026 candidates.
 */
export function useKnownNominees2026() {
  return useQuery({
    queryKey: ["known_nominees_2026"],
    queryFn: () =>
      fetchJson<KnownNominee2026[]>("/data/candidates_2026_known.json"),
  });
}

export interface DistrictVoters2026 {
  district: string;
  total_voters_2026: number;
  female_voters_2026: number;
  male_voters_2026: number;
  source: string;
}

/**
 * District-wise registered-voter rolls for 2026, sourced from the Vision
 * Gilgit Baltistan portal. Includes a female + male split per district.
 * District totals sum to 774,319 (GB-wide) and reconcile against the
 * elections.json 2026 registered_voters figure.
 */
export function useDistrictVoters2026() {
  return useQuery({
    queryKey: ["voters_by_district_2026"],
    queryFn: () =>
      fetchJson<DistrictVoters2026[]>("/data/voters_by_district_2026.json"),
  });
}

export interface NotableDisqualification {
  candidate_name: string;
  party_at_disqualification: string;
  constituency_id_2020: string;
  year_disqualified: number;
  role_at_time: string;
  impact_2026: string;
  source: string;
}

/**
 * Notable disqualifications that materially shape the 2026 race. Currently
 * holds Khalid Khurshid (2020 PTI chief minister, disqualified 2023, not
 * contesting 2026 → GBA-13 is effectively an open seat).
 */
export function useNotableDisqualifications() {
  return useQuery({
    queryKey: ["notable_disqualifications"],
    queryFn: () =>
      fetchJson<NotableDisqualification[]>(
        "/data/notable_disqualifications.json",
      ),
  });
}

export interface Forecast2026Prediction {
  constituency_id: string;
  election_year: number;
  party: string;
  pred_proba: number;
  ci_lower_80: number;
  ci_upper_80: number;
  bootstrap_median: number;
}

export interface Forecast2026Summary {
  model_version: string;
  election_date: string;
  federal_incumbent: string;
  total_general_seats: number;
  parties_scored: string[];
  point_estimate_seats: Record<string, number>;
  bootstrap_80_ci_seats: Record<
    string,
    { median: number; p10: number; p90: number; mean: number }
  >;
  n_bootstrap: number;
  forecast_is_informative: boolean;
  honest_finding: string | null;
  caveats: string[];
}

export function useForecast2026() {
  return useQuery({
    queryKey: ["forecast_2026"],
    queryFn: async () => {
      const rows = await fetchJson<Forecast2026Prediction[]>(
        "/data/predictions_2026.json",
      );
      return coerceNumericFields(rows, [
        "election_year",
        "pred_proba",
        "ci_lower_80",
        "ci_upper_80",
        "bootstrap_median",
      ]);
    },
  });
}

export function useForecast2026Summary() {
  return useQuery({
    queryKey: ["forecast_2026_summary"],
    queryFn: () =>
      fetchJson<Forecast2026Summary>("/data/forecast_summary_2026.json"),
  });
}
