import { addToast } from "@heroui/react";

// Opens an external payment URL (MercadoPago Checkout Pro).
//
// Browsers only allow a synchronous `window.open` during the user gesture that
// triggered it. When the link was minted after an `await` (regeneration) the
// popup may be blocked and `window.open` returns null — in that case we copy the
// link and show the exact URL instead of claiming it opened.
export const openPaymentLink = async (url: string): Promise<void> => {
  if (!url) return;

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) {
    addToast({ title: "Abrimos el link de pago de la seña", color: "success" });
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
    addToast({
      title: "Copiamos el link de pago",
      description: `Abrí este link para pagar la seña: ${url}`,
      color: "warning",
    });
  } catch {
    addToast({
      title: "Abrí este link para pagar la seña",
      description: url,
      color: "warning",
    });
  }
};
