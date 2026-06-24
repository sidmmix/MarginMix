export type ConsentValue = "accepted" | "declined" | null;

export const CONSENT_KEY = "marginmix_cookie_consent";

export function getStoredConsent(): ConsentValue {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "accepted" || v === "declined") return v;
    return null;
  } catch {
    return null;
  }
}
