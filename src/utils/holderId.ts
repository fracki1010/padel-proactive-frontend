const HOLDER_ID_KEY = "padexa:holder_id";

const generateHolderId = () => {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to the timestamp-based id
  }
  return `h_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Stable anonymous identity for the browser. It owns temporary slot locks so a
 * visitor keeps their slot while finishing the booking flow without logging in.
 */
export const getHolderId = () => {
  try {
    const existing = localStorage.getItem(HOLDER_ID_KEY);
    if (existing) return existing;
    const generated = generateHolderId();
    localStorage.setItem(HOLDER_ID_KEY, generated);
    return generated;
  } catch {
    return generateHolderId();
  }
};
