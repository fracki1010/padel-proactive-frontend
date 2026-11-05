import type { TournamentStatus } from "../../services/tournamentService";

export const MIN_CATEGORY_TEAMS = 2;
export const MAX_CATEGORY_TEAMS = 64;

export type TournamentStatusColor =
  | "default"
  | "primary"
  | "success"
  | "danger";

export const TOURNAMENT_STATUS_META: Record<
  TournamentStatus,
  { label: string; color: TournamentStatusColor }
> = {
  draft: { label: "Borrador", color: "default" },
  in_progress: { label: "En curso", color: "primary" },
  finished: { label: "Finalizado", color: "success" },
  cancelled: { label: "Cancelado", color: "danger" },
};

export type TournamentTabKey =
  | "resumen"
  | "categorias"
  | "parejas"
  | "llaves"
  | "programacion"
  | "resultados";

export const TOURNAMENT_TABS: { key: TournamentTabKey; label: string }[] = [
  { key: "resumen", label: "Resumen" },
  { key: "categorias", label: "Categorías" },
  { key: "parejas", label: "Parejas" },
  { key: "llaves", label: "Llaves" },
  { key: "programacion", label: "Programación" },
  { key: "resultados", label: "Resultados" },
];

// Tabs that render team names/rosters. Resumen and Categorías do not.
export const TAB_USES_TEAMS: TournamentTabKey[] = [
  "parejas",
  "llaves",
  "programacion",
  "resultados",
];
