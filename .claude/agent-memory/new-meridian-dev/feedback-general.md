---
name: General Collaboration Preferences
description: Observed preferences for how this user wants to collaborate on the New Meridian project
type: feedback
---

Always read Scene3D.tsx fully before editing it — the animation loop, scroll handler, and cleanup are tightly coupled and changes in one area cascade to others.

**Why:** Explicitly stated in the system prompt and the user's request framing. The file is ~1050 lines with interdependent systems.
**How to apply:** Never make assumptions about Scene3D.tsx based on partial reads. Always read the full file at the start of any session that touches it.

Prefer additive changes over refactoring existing systems unless explicitly asked.

**Why:** Reduces risk of breaking the tightly coupled animation loop.
**How to apply:** When asked to "improve" something, add to it rather than replace it where possible.

No emojis in responses or files.

**Why:** Stated in system prompt.
**How to apply:** Always — no exceptions.
