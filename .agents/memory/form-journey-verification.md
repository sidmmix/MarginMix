---
name: Animated form journey verification
description: Verify return-to-form navigation with animations enabled, not just direct page loads.
---

Test returning from calculator results to the input form with normal animations enabled and enter the first value promptly.

**Why:** Direct-load checks passed while the animated return journey briefly mounted a new form twice and cleared its first input. Disabling animations would have concealed the regression.

**How to apply:** Include both direct-entry and “run another engagement” journeys in browser checks. Do not dismiss missing first-field values as automation timing without investigating the page transition.
