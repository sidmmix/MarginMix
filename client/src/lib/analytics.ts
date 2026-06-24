declare function gtag(...args: unknown[]): void;

function track(eventName: string, params: Record<string, unknown> = {}) {
  try {
    if (typeof gtag !== "undefined") {
      gtag("event", eventName, params);
    }
  } catch {
  }
}

export const analytics = {
  questionView(source: "assessment" | "profiler", questionNumber: number, questionId: string, section: string) {
    track("question_view", {
      event_category: source,
      question_number: questionNumber,
      question_id: questionId,
      question_section: section,
    });
  },

  questionAnswered(source: "assessment" | "profiler", questionNumber: number, questionId: string, section: string, answer: string) {
    track("question_answered", {
      event_category: source,
      question_number: questionNumber,
      question_id: questionId,
      question_section: section,
      answer_value: answer,
    });
  },

  marginEntered(source: "assessment" | "profiler", margin: string) {
    track("margin_entered", {
      event_category: source,
      margin_value: margin,
    });
  },

  assessmentStarted() {
    track("assessment_started", { event_category: "assessment" });
  },

  reviewReached(totalQuestions: number) {
    track("review_reached", { event_category: "assessment", total_questions: totalQuestions });
  },

  assessmentSubmitted() {
    track("assessment_submitted", { event_category: "assessment" });
  },

  profilerStarted() {
    track("profiler_started", { event_category: "profiler" });
  },

  profilerCompleted(verdict: string) {
    track("profiler_completed", { event_category: "profiler", verdict });
  },

  profilerContinuedToAssessment() {
    track("profiler_continued_to_assessment", { event_category: "profiler" });
  },
};
