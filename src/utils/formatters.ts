const pad2 = (value: number) => String(value).padStart(2, "0");

export const toIsoDateKey = (value: string | Date) => {
  if (value instanceof Date) {
    return `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}`;
  }

  const raw = String(value || "").trim();
  const direct = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (direct) return direct[1];

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return `${parsed.getUTCFullYear()}-${pad2(parsed.getUTCMonth() + 1)}-${pad2(parsed.getUTCDate())}`;
};

export const getTodayIsoLocal = () => {
  const today = new Date();
  return `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
};

export const formatDate = (dateString: string) => {
  const iso = toIsoDateKey(dateString);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return String(dateString || "");

  const [year, month, day] = iso.split("-").map(Number);
  const stableDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const text = stableDate.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  return text.replace(",", "");
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
};

const PHONE_PREFIXES = [
  { prefix: "598", flag: "🇺🇾" },
  { prefix: "595", flag: "🇵🇾" },
  { prefix: "591", flag: "🇧🇴" },
  { prefix: "549", flag: "🇦🇷" }, // Argentina con 9 — antes que "54"
  { prefix: "54",  flag: "🇦🇷" }, // Argentina sin 9
  { prefix: "56",  flag: "🇨🇱" },
  { prefix: "55",  flag: "🇧🇷" },
  { prefix: "52",  flag: "🇲🇽" },
  { prefix: "51",  flag: "🇵🇪" },
  { prefix: "57",  flag: "🇨🇴" },
  { prefix: "34",  flag: "🇪🇸" },
  { prefix: "1",   flag: "🇺🇸" },
];

export const formatPhoneForDisplay = (value: string) => {
  const digits = String(value || "").trim().replace(/\D/g, "");
  if (!digits) return "";

  for (const { prefix, flag } of PHONE_PREFIXES) {
    if (digits.startsWith(prefix)) {
      const local = digits.slice(prefix.length);
      return local ? `${flag} ${local}` : digits;
    }
  }

  return digits;
};
