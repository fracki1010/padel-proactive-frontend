import { AlertTriangle } from "lucide-react";

import type { TournamentStatus } from "../../../services/tournamentService";

type MatchActionsNoticeProps = {
  bracketStale?: boolean;
  tournamentStatus: TournamentStatus;
};

export const MatchActionsNotice = ({
  bracketStale,
  tournamentStatus,
}: MatchActionsNoticeProps) => (
  <>
    {bracketStale && (
      <div className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
        <p className="text-foreground">
          La llave está desactualizada porque cambió la lista de parejas.
          Regenerala antes de programar partidos o cargar resultados.
        </p>
      </div>
    )}
    {tournamentStatus !== "in_progress" && (
      <p className="text-xs font-semibold text-on-surface-variant">
        Activá el torneo para generar la llave, programar partidos y cargar
        resultados.
      </p>
    )}
  </>
);
