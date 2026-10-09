export type WeekdayOption = {
  value: number;
  short: string;
  label: string;
};

// JS Date weekday convention: 0 = DOM (Sunday) ... 6 = SÁB (Saturday).
// Rendered in the order the club thinks of the week.
export const WEEKDAYS: WeekdayOption[] = [
  { value: 0, short: "DOM", label: "Domingo" },
  { value: 1, short: "LUN", label: "Lunes" },
  { value: 2, short: "MAR", label: "Martes" },
  { value: 3, short: "MIÉ", label: "Miércoles" },
  { value: 4, short: "JUE", label: "Jueves" },
  { value: 5, short: "VIE", label: "Viernes" },
  { value: 6, short: "SÁB", label: "Sábado" },
];
