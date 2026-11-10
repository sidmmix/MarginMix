import assert from "node:assert/strict";
import { test } from "node:test";
import { analytics } from "./analytics";

type TrackedCall = [name: string, ...args: unknown[]];

function installBrowserState(consent: string | null) {
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const tracked: TrackedCall[] = [];
  const dataLayer: Record<string, unknown>[] = [];

  for (const key of ["localStorage", "window", "dataLayer"]) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  }

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => consent },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { umami: { track: (...args: TrackedCall) => tracked.push(args) } },
  });
  Object.defineProperty(globalThis, "dataLayer", {
    configurable: true,
    value: dataLayer,
  });

  return {
    tracked,
    dataLayer,
    restore() {
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

test("completion events are suppressed unless cookie consent is accepted", () => {
  for (const consent of [null, "declined"]) {
    const state = installBrowserState(consent);
    try {
      analytics.profilerCompleted("private-verdict");
      analytics.leakFormSubmitted();

      assert.deepEqual(state.tracked, []);
      // GTM remains consent-managed at its own layer and retains its existing pushes.
      assert.deepEqual(state.dataLayer, [
        {
          event: "profiler_completed",
          event_category: "profiler",
          verdict: "private-verdict",
        },
        { event: "leak_form_submitted", event_category: "free_tier_leak" },
      ]);
    } finally {
      state.restore();
    }
  }
});

test("accepted consent sends completion event names only to Replit Analytics", () => {
  const state = installBrowserState("accepted");
  try {
    analytics.profilerCompleted("private-answer-or-financial-value");
    analytics.leakFormSubmitted();

    assert.deepEqual(state.tracked, [
      ["free_delivery_risk_check_completed"],
      ["leak_calculator_completed"],
    ]);
    assert.deepEqual(state.dataLayer, [
      {
        event: "profiler_completed",
        event_category: "profiler",
        verdict: "private-answer-or-financial-value",
      },
      { event: "leak_form_submitted", event_category: "free_tier_leak" },
    ]);
  } finally {
    state.restore();
  }
});
