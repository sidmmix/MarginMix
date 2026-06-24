// GTM dataLayer-based analytics — events are consent-gated by Consent Mode v2 at the GTM layer.
// GTM reads these pushes natively. In GTM, set up one GA4 Event tag triggered by
// "Custom Event — All Events" to capture everything below.

declare const dataLayer: Record<string, unknown>[];

function push(event: string, params: Record<string, unknown> = {}) {
  try {
    if (typeof dataLayer !== "undefined") {
      dataLayer.push({ event, ...params });
    }
  } catch {}
}

export const analytics = {
  questionView(source: "assessment" | "profiler", questionNumber: number, questionId: string, section: string) {
    push("question_view", {
      event_category: source,
      question_number: questionNumber,
      question_id: questionId,
      question_section: section,
    });
  },

  questionAnswered(source: "assessment" | "profiler", questionNumber: number, questionId: string, section: string, answer: string) {
    push("question_answered", {
      event_category: source,
      question_number: questionNumber,
      question_id: questionId,
      question_section: section,
      answer_value: answer,
    });
  },

  marginEntered(source: "assessment" | "profiler", margin: string) {
    push("margin_entered", {
      event_category: source,
      margin_value: margin,
    });
  },

  assessmentStarted() {
    push("assessment_started", { event_category: "assessment" });
  },

  reviewReached(totalQuestions: number) {
    push("review_reached", { event_category: "assessment", total_questions: totalQuestions });
  },

  assessmentSubmitted() {
    push("assessment_submitted", { event_category: "assessment" });
  },

  profilerStarted() {
    push("profiler_started", { event_category: "profiler" });
  },

  profilerCompleted(verdict: string) {
    push("profiler_completed", { event_category: "profiler", verdict });
  },

  profilerContinuedToAssessment() {
    push("profiler_continued_to_assessment", { event_category: "profiler" });
  },
};
