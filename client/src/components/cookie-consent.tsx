import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

const CONSENT_KEY = "marginmix_cookie_consent";

export type ConsentValue = "accepted" | "declined" | null;

export function getStoredConsent(): ConsentValue {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "accepted" || v === "declined") return v;
    return null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getStoredConsent()) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const respond = (choice: "accepted" | "declined") => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100vw-2rem)] max-w-lg"
        >
          <div className="relative bg-gray-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 px-6 py-5 text-white">

            {/* Dismiss */}
            <button
              onClick={() => respond("declined")}
              className="absolute top-3.5 right-3.5 p-1 rounded-full text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Icon + heading */}
            <div className="flex items-start gap-3 mb-3">
              <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Cookie className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white leading-snug">We use cookies</p>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                  Analytics cookies help us understand how you use MarginMix so we can improve the experience. No personal data is sold or shared.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end mt-4">
              <button
                onClick={() => respond("declined")}
                className="text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => respond("accepted")}
                className="text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-1.5 rounded-lg transition-colors shadow-sm shadow-emerald-900/40"
              >
                Accept all
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
