// Tikos doesn't run its own delivery — orders are fulfilled via Uber Eats.
// TODO: Replace with the exact Uber Eats restaurant URL for Tikos when available.
export const UBER_EATS_URL =
  "https://www.ubereats.com/ke/search?q=Tikos%20Athi%20River";

export const openUberEats = () => {
  window.open(UBER_EATS_URL, "_blank", "noopener,noreferrer");
};
