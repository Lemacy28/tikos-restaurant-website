// Tikos doesn't run its own delivery — orders are fulfilled via Uber Eats.
export const UBER_EATS_URL =
  "https://www.ubereats.com/ke/store/tikoskitengela/PYu55jDxV32G9y-SUsmLIw";

export const openUberEats = () => {
  window.open(UBER_EATS_URL, "_blank", "noopener,noreferrer");
};

// WhatsApp ordering line (Kenya, international format without +)
export const WHATSAPP_NUMBER = "254729088088";

export const buildWhatsAppUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const openWhatsApp = (message: string) => {
  window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
};
