// Tikos doesn't run its own delivery — orders are fulfilled via Uber Eats.
export const UBER_EATS_URL =
  "https://www.ubereats.com/ke/store/tikoskitengela/PYu55jDxV32G9y-SUsmLIw";

export const openUberEats = () => {
  window.open(UBER_EATS_URL, "_blank", "noopener,noreferrer");
};
