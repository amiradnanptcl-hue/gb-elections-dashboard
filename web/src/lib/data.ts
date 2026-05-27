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

export function useConstituencies() {
  return useQuery({
    queryKey: ["constituencies"],
    queryFn: () => fetchJson<Constituency[]>("/data/constituencies.json"),
  });
}

export function useElections() {
  return useQuery({
    queryKey: ["elections"],
    queryFn: () => fetchJson<ElectionMeta[]>("/data/elections.json"),
  });
}

export function useCandidateRuns() {
  return useQuery({
    queryKey: ["candidate_runs"],
    queryFn: () => fetchJson<CandidateRun[]>("/data/candidate_runs.json"),
  });
}

export function useConstituencySummary() {
  return useQuery({
    queryKey: ["constituency_summary"],
    queryFn: () =>
      fetchJson<ConstituencySummary[]>("/data/constituency_election_summary.json"),
  });
}

export function useHoldoutPredictions() {
  return useQuery({
    queryKey: ["holdout_predictions"],
    queryFn: () =>
      fetchJson<HoldoutPrediction[]>("/data/predictions_2020_holdout.json"),
  });
}

export function useModelReport() {
  return useQuery({
    queryKey: ["model_report"],
    queryFn: () => fetchJson<ModelReport>("/data/training_report.json"),
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
    queryFn: () => fetchJson<Forecast2026Prediction[]>("/data/predictions_2026.json"),
  });
}

export function useForecast2026Summary() {
  return useQuery({
    queryKey: ["forecast_2026_summary"],
    queryFn: () =>
      fetchJson<Forecast2026Summary>("/data/forecast_summary_2026.json"),
  });
}
