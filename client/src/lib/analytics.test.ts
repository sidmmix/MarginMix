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

test("question answers and margins stay out of Replit Analytics while retaining GTM payloads", () => {
  const state = installBrowserState("accepted");
  try {
    analytics.questionAnswered("assessment", 7, "private-question-id", "private-section", "private-answer");
    analytics.questionAnswered("profiler", 2, "profiler-question-id", "profiler-section", "private-profiler-answer");
    analytics.marginEntered("assessment", "private-margin");
    analytics.marginEntered("profiler", "private-profiler-margin");

    // These paths have no approved Replit Analytics event names.
    assert.deepEqual(state.tracked, []);

    // Preserve the existing GTM payload behavior, including answer and margin values.
    assert.deepEqual(state.dataLayer, [
      {
        event: "question_answered",
        event_category: "assessment",
        question_number: 7,
        question_id: "private-question-id",
        question_section: "private-section",
        answer_value: "private-answer",
      },
      {
        event: "question_answered",
        event_category: "profiler",
        question_number: 2,
        question_id: "profiler-question-id",
        question_section: "profiler-section",
        answer_value: "private-profiler-answer",
      },
      {
        event: "margin_entered",
        event_category: "assessment",
        margin_value: "private-margin",
      },
      {
        event: "margin_entered",
        event_category: "profiler",
        margin_value: "private-profiler-margin",
      },
    ]);
  } finally {
    state.restore();
  }
});
