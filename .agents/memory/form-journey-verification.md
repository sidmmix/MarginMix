---
name: Animated form journey verification
description: Verify return-to-form navigation with animations enabled, not just direct page loads.
---

Test returning from calculator results to the input form with normal animations enabled and enter the first value promptly.

**Why:** Direct-load checks passed while the animated return journey briefly mounted a new form twice and cleared its first input. Disabling animations would have concealed the regression.

**How to apply:** Include both direct-entry and “run another engagement” journeys in browser checks. Do not dismiss missing first-field values as automation timing without investigating the page transition.

Also test submitting an incomplete calculator after editing and clearing a field, not only submitting an untouched blank form.

**Why:** Blur-time validation initially moved the Calculate button between pointer down and pointer up, canceling the first click.

**How to apply:** Start with a focused field, clear it, then submit once and confirm every invalid field receives its error state.

For automatic question transitions, test entering an answer as soon as the new field appears and waiting for the next question.

**Why:** A delayed callback in the quick profiler retained transition state from the previous render and could leave a valid margin answer on the same screen.

**How to apply:** Check actual automatic movement after the preceding animation, not only manual Continue or direct page load.
