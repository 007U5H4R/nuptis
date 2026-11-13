# Lessons learnt: Nuptis

> Sources: Obsidian `Nuptis/Nuptis Deployment.md` (Deployment note), Obsidian `Nuptis — Guest mode + films (2026-10-17).md` (Guest-mode note), and repo commits.

## Lessons

### L1 — Link previews are cached by every platform
- **Situation:** Changes to Open Graph tags didn't show up in shared links. (Deployment note)
- **Decision/Outcome:** LinkedIn Post Inspector re-scrapes after each change. WhatsApp needs a cache-busting `?v=N`. (Deployment note)
- **Lesson → Future Rule:** **Future Rule:** after any OG change, force a re-scrape on each target platform before calling the preview verified.

### L2 — Visual QA fell back to manual checks
- **Situation:** The Chrome extension was disconnected, so visual QA was done by hand. (Deployment note)
- **Decision/Outcome:** It was recorded as a manual check. (Deployment note)
- **Lesson → Future Rule:** **Future Rule:** confirm that the browser-automation tooling is connected before the QA stage, or record the gap explicitly.

### L3 — Guest mode is kept separate from the database
- **Situation:** A guest mode was added. (Guest-mode note)
- **Decision/Outcome:** Guest mode never touches Supabase, and RLS still blocks anonymous access. Guest state lives in memory, so a reload returns to the login screen. (Guest-mode note)
- **Lesson → Future Rule:** **Future Rule:** a demo or guest path must not widen database access. Document the limits of in-memory state for users.

### L4 — The login card overflowed at phone width
- **Situation:** The login card overflowed at 375px. (3552190)
- **Decision/Outcome:** It was fixed in 3552190.
- **Lesson → Future Rule:** **Future Rule:** check every entry screen at 375px before release.

### L5 — Nested backdrop-filter can't blur
- **Situation:** A nested `backdrop-filter` didn't blur. (91f0faf)
- **Decision/Outcome:** It was fixed in 91f0faf.
- **Lesson → Future Rule:** **Future Rule:** don't nest backdrop-filter elements. Apply the blur at a single layer.

### L6 — Film post-production
- **Situation:** The product film needed an edit and an audio finish. (Guest-mode note)
- **Decision/Outcome:** The Recordly edit was not re-framed. The narration had a v/w mishearing to correct. A single loudnorm pass overshot, so the audio was finished with a limiter. (Guest-mode note)
- **Lesson → Future Rule:** **Future Rule:** finish narration audio with a limiter after loudnorm, and proofread the transcript against the script.

## Reusable Rules for Future Projects
- Re-scrape the OG preview on each platform after every change (L1).
- Guest or demo modes never widen database access (L3).

## Candidate Global CLAUDE.md Improvements
- The web-deliverables link-preview check could name platform cache-busting: WhatsApp `?v=N` and a LinkedIn re-scrape (L1).
