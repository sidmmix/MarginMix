import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { getStoredConsent, CONSENT_KEY } from "@/lib/consent";

declare function gtag(...args: unknown[]): void;

function pushConsentUpdate(granted: boolean) {
  try {
    if (typeof gtag !== "undefined") {
      const state = granted ? "granted" : "denied";
      gtag("consent", "update", {
        analytics_storage:  state,
        ad_storage:         state,
        ad_user_data:       state,
        ad_personalization: state,
      });
    }
  } catch {}
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
    pushConsentUpdate(choice === "accepted");
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
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 px-6 py-5">

            {/* Dismiss */}
            <button
              onClick={() => respond("declined")}
              className="absolute top-3.5 right-3.5 p-1 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Icon + heading */}
            <div className="flex items-start gap-3 mb-3">
              <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <Cookie className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900 leading-snug">We use cookies</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Analytics cookies help us understand how you use MarginMix so we can improve the experience. No personal data is sold or shared.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end mt-4">
              <button
                onClick={() => respond("declined")}
                className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => respond("accepted")}
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg transition-colors shadow-sm"
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
