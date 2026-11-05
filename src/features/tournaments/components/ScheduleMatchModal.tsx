import {
  addToast, Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
  Select, SelectItem,
} from "@heroui/react";
import { useMemo, useState } from "react";

import { fieldInputClassNames, fieldSelectClassNames } from "../../../components/ui/fieldStyles";
import { useFixedBookings } from "../../../features/fixed-bookings/hooks/useFixedBookings";
import { useBookings, useCourts, useSlots } from "../../../hooks/useData";
import { getErrorMessage } from "../../../services/apiError";
import type { Tournament, TournamentMatch } from "../../../services/tournamentService";
import { slotsForCourt } from "../../../utils/slots";
import { useScheduleMatch } from "../hooks/useTournaments";

type ScheduleMatchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  categoryId: string;
  match: TournamentMatch;
  tournament: Tournament;
  matches: TournamentMatch[];
};

const extractId = (ref: { _id?: string } | string | null | undefined): string =>
  !ref ? "" : typeof ref === "string" ? ref : (ref._id ?? "");
const toDateKey = (value?: string | null): string => (value ? value.slice(0, 10) : "");
const getUtcWeekday = (dateKey: string): number => {
  const parsed = new Date(`${dateKey}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? -1 : parsed.getUTCDay();
};
export const ScheduleMatchModal = ({
  isOpen, onClose, tournamentId, categoryId, match, tournament, matches,
}: ScheduleMatchModalProps) => {
  const { data: courtsData } = useCourts();
  const { data: slotsData } = useSlots();
  const { data: bookingsData } = useBookings(undefined, isOpen);
  const { data: fixedData } = useFixedBookings();
  const scheduleMatch = useScheduleMatch(tournamentId, categoryId);
  const [courtId, setCourtId] = useState(match.court ?? "");
  const [date, setDate] = useState(match.date ?? tournament.startDate);
  const [slotId, setSlotId] = useState(match.timeSlot ?? "");
  const [error, setError] = useState("");

  const courts = (courtsData?.data ?? []).filter(
    (court) => tournament.courts.includes(court._id) && court.isActive !== false,
  );
  // Occupancy mirrors the backend guard: bookings, active fixed turns and the
  // other tournament matches. The backend stays authoritative and answers 409.
  const occupiedSlotIds = useMemo(() => {
    const occupied = new Set<string>();
    if (!courtId || !date) return occupied;
    const weekday = getUtcWeekday(date);
    for (const booking of bookingsData?.data ?? []) {
      if (booking.status === "cancelado" || extractId(booking.court) !== courtId) continue;
      if (toDateKey(booking.date) !== date) continue;
      const id = extractId(booking.timeSlot);
      if (id) occupied.add(id);
    }
    for (const fixed of fixedData?.data ?? []) {
      if (fixed.status !== "active" || fixed.weekday !== weekday) continue;
      if (extractId(fixed.court) !== courtId) continue;
      const id = extractId(fixed.timeSlot);
      if (id) occupied.add(id);
    }
    for (const other of matches) {
      if (other._id === match._id || other.court !== courtId || other.date !== date) continue;
      if (other.timeSlot) occupied.add(other.timeSlot);
    }
    return occupied;
  }, [courtId, date, bookingsData, fixedData, matches, match._id]);

  const availableSlots = slotsForCourt(courtId, slotsData?.data ?? [])
    .filter((slot) => !occupiedSlotIds.has(slot._id));

  const handleSubmit = async () => {
    setError("");
    if (!courtId || !date || !slotId) {
      return addToast({ title: "Elegí cancha, fecha y horario.", color: "warning" });
    }
    try {
      await scheduleMatch.mutateAsync({ matchId: match._id, court: courtId, date, timeSlot: slotId });
      addToast({ title: "Partido programado", color: "success" });
      onClose();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "No se pudo programar el partido."));
    }
  };

  const labelClass = "text-sm font-semibold text-on-surface-variant uppercase tracking-wider";
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" backdrop="blur" className="bg-surface-container-high text-foreground dark">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-black">Programar partido</h2>
          <p className="text-sm font-normal text-on-surface-variant">
            Solo canchas del torneo, dentro de {tournament.startDate} y {tournament.endDate}. No se crea una reserva.
          </p>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div className="space-y-2"><label id="match-court-label" className={labelClass}>Cancha</label>
            <Select aria-labelledby="match-court-label" placeholder="Elegí una cancha"
              selectedKeys={courtId ? [courtId] : []}
              onSelectionChange={(keys) => { setCourtId(String(Array.from(keys)[0] ?? "")); setSlotId(""); }}
              variant="bordered" size="lg" classNames={fieldSelectClassNames.lg}>
              {courts.map((court) => <SelectItem key={court._id}>{court.name}</SelectItem>)}
            </Select></div>
          <div className="space-y-2"><label htmlFor="match-date" className={labelClass}>Fecha</label>
            <Input id="match-date" type="date" value={date} min={tournament.startDate} max={tournament.endDate}
              onValueChange={(value) => { setDate(value); setSlotId(""); }}
              variant="bordered" size="lg" classNames={fieldInputClassNames.lg} /></div>
          <div className="space-y-2"><label id="match-slot-label" className={labelClass}>Horario disponible</label>
            <Select aria-labelledby="match-slot-label" placeholder="Elegí un horario"
              selectedKeys={slotId ? [slotId] : []}
              onSelectionChange={(keys) => setSlotId(String(Array.from(keys)[0] ?? ""))}
              variant="bordered" size="lg" classNames={fieldSelectClassNames.lg}>
              {availableSlots.map((slot) => <SelectItem key={slot._id}>{slot.startTime} - {slot.endTime}</SelectItem>)}
            </Select>
            {courtId && availableSlots.length === 0 && (
              <p className="text-xs font-semibold text-on-surface-variant px-1">
                No hay horarios libres para esa cancha y fecha.
              </p>
            )}
          </div>
          {error && <p className="text-sm font-semibold text-danger">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={scheduleMatch.isPending}>Cancelar</Button>
          <Button color="primary" onPress={handleSubmit} isLoading={scheduleMatch.isPending} className="font-black">
            Guardar horario
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
