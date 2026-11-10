# Roughly (Qatar edition)

Daily estimation game for Qatar. Three open-ended "how many…?" questions a day, no exact answers, scored on how close your reasoning gets. Future editions for other GCC countries (Roughly Oman etc.). Share URL format: `roughly.gg/Qatar`.
Owner: SWISS, solo founder based in Doha. Tone in copy: human, warm, a bit funny. Never robotic.

## Working agreement
- Treat product direction as direction, not approval. For anything material (new features, flow changes, design changes), list what you'd change with benefit and trade-off, and wait for approval before building.
- Keep it simple. Don't over-complicate setup. Ask before adding dependencies or a build step.
- Say plainly what was tested and what wasn't.

## Product principles (from the owner's brief)
- Anyone can play. No maths expertise or local knowledge required.
- Challenge, don't punish. Reward being close, right scale, improving. Scores never hit zero.
- Reveal must be memorable and satisfying even when the guess is wildly wrong.
- Explain every answer with simple reasoning. Tag each as Official / Derived / Rough estimate.
- Reasons to return: fresh questions daily, calibration, archive. Do NOT weaponise streaks.
- Sharing is part of the game: "What would YOU have guessed?" Never reveal answers to the recipient before they play.
- Social comparison comes after answering.
- Mobile + WhatsApp first. A shared link should become a game almost instantly.
- Virality first, monetisation later. Protect simplicity: the player always wants "one more", never wonders how many are left.
- Be recognisable: editorial/puzzle feel, Gulf character, strong typography. Avoid generic AI/SaaS look.

## Design rules
- Bright, colourful, game-like. Each daily question gets its own vivid "candy" colour, driven by CSS vars (`--c`, `--c2`, `--ct`, `--cs`) set on `<body>` per question slot via `setTheme()`/`THEMES` (blue, coral, violet); results use a green "win" theme (`WIN`). Soft coloured shadows give depth.
- Font: Fredoka (rounded, playful) throughout.
- No emojis anywhere (UI or copy). Icons are inline SVG.
- Big, bold typography: large question text and large answer text.
- Question and reveal screens are vertically centred and sized to fit one phone screen (no scroll). The primary action button sits in normal flow — no floating bar, no arrow icon.
- Category shown as its icon only (a badge in the stepper row), never spelled out. No "Question 1 of 3".
- Reveal is a quick, bright "hit": a coloured score block (green/amber/red by closeness) with a fast count-up and a thump. Results show a big count-up score, Top X%, the three questions (icon + text + score), last-7-days, and a large "Next drop in" countdown bubble with a "Play past drops" button.
- Landing page first for normal visits: game-like hero (three colour "drops", bold headline, Play button) + numbered step cards + categories + short FAQ. Challenge links skip it.

## Repo layout
- `index.html` the entire game: HTML + CSS + vanilla JS in one file. No build step, no dependencies.
- `backend/server.js` optional zero-dependency Node 18+ server (stats, email-code sign-in, progress sync). See `backend/README.md`.

## How the game works (index.html)
- Day number = days since epoch (UTC date of the player's local date). `START` = 1 Oct 2026 (archive start). `today`/`day` globals.
- Question bank `Q` (133 questions, ~98 regular + 35 category "Doha life"). Shape: `{c category, t text, u unit, m our estimate, lo, hi plausible range, s [logic steps], f fun fact, k optional kind}`. `HINTS` is a parallel array (same index) of `["Good to know", text]`.
- APPEND new questions and hints at the end only. Never reorder: stats, saved games and sync match questions by index.
- `pick(d)`: days before `ROT_START` (11 Nov 2026) use the old seeded random picker (`legacyPick`, kept so past days stay as played). From `ROT_START` on, questions rotate with no repeats: every question is used once per cycle and none returns sooner than about half a cycle. The first cycle serves questions that were never dropped under the old picker first. 2 regular + 1 Doha life per day, same for everyone. Pool order matters, so only append to `Q`/`HINTS`.
- Answers are stored in base units. `UNITS` lets players answer in other units (km/miles, kg/lb, litres/gallons, hours/minutes, QAR/USD/EUR/GBP/INR/PKR/PHP, tonnes/US tons). Currency rates are fixed approximations in `UNITS`.
- Scoring: `score = max(1, round(100 / (1 + d²/0.36)))` where `d = log10(ratio)`, ratio = how many times too high/low. Spot on 100, 2x off about 80, 10x off about 26, never 0.
- Ranks (average of three): Fresh Off the Plane, Karak Rookie, Corniche Regular, Souq Veteran, Majlis Elder, Desert Oracle (thresholds 0/15/35/55/72/88).
- Source tags: `KINDS` O/D/R. Default is R (Rough estimate). Only a few questions are D (set by a list near `KINDS`). Nothing is O yet.
- One free "Good to know" note per question (no score penalty). Calculator and notes sheet per question.
- Reveal and results screens: animated count-up, bell-curve chart with moving percentile dot, bar chart behind the curve, per-guess bars.
- Calibration was removed from the UI. Ranks still exist in code (`TIERS`/`rankOf`, used in share text) but the rank name is no longer shown on the results screen (only Top X%).
- Challenge links: `?c=<day>.<s1>-<s2>-<s3>[.<name>]` (scores only, never answers). `parseChallenge()` validates, stores `rq-ch-<day>`, selects that day and skips the landing page. Head-to-head shows after finishing.
- Sheets: one bottom sheet `#sheet` + `#scrim` for calculator, menu (sign in, calibration, archive calendar), share. Desktop (>=960px) shows a sidebar layout and centred modal.

## Local storage keys
`tk8-s<day>` per-day game state (ids, g, s, un, hu, nt, r, pd), `tk7-stats` (streak, played, total), `rq-units`, `rq-pid` (anonymous player id), `rq-tok` and `rq-email` (signed in), `rq-name` (challenge name), `rq-ch-<day>` (received challenge).

## Two modes
- No backend and no Firestore answers: charts show an honest "coming soon" note and collapse (`noChart()` adds `.nochart` to `.rtop`/`.revrow` so the layout centres). Never show invented numbers.
- Real data: node backend if `<meta name="roughly-api">` is set, otherwise Firestore `answers`. Shown only once `MINN`=30 players answered that question.

## Backend API (backend/server.js)
`POST /answer {pid,day,qi,r,s}`, `GET /stats?day=`, `POST /auth/start {email}`, `POST /auth/verify {email,code}`, `GET|PUT /sync` (Bearer token). Data in `DATA_DIR/db.json`. Env: PORT, DATA_DIR, ORIGIN, DEV=1 (shows codes, testing only), RESEND_API_KEY + MAIL_FROM for email.

## Verifying changes
No test suite in the repo. Previously verified with jsdom smoke tests and Playwright (mobile 400px and desktop 1440px) against a local backend started with `DEV=1`. Check at least: all 33 questions score 100 at their own estimate; closed sheet is not visible; reveal and results animate with no console errors; share sheet builds the challenge link; a `?c=` link skips landing and shows head-to-head; sign-in and sync work with the dev code.

## Open items
- Decide hosting: GitHub Pages (free, static) for the game; backend needs a Node host.
- Domain: share links say `https://roughly.gg/Qatar?c=...`. For `/Qatar` to be a real path the game must be served from a `Qatar/` folder or a 404 fallback. Until the domain exists the links go nowhere.
- Set up email (Resend) before enabling sign-in for real users.
- Question wording sometimes says "kilometres" while the player answers in miles. Consider making titles follow the chosen unit.
- Hardening if scores become competitive: players can clear storage and answer twice.
- More questions (append only), special editions, friend streak-free progress ideas.

## Archive lock, streak coins, bonus games (10 Nov 2026)
- `ARCHIVE_OPEN=false` locks past days. The calendar, the "Play past drops" button and past-day challenge links are switched off, not deleted. Set the flag to true to bring them back.
- `STREAK_COIN_EVERY=3`: finishing today's game on a streak that is a multiple of 3 awards one coin (`rq-coins`, once per day). The results screen has a yellow coin card: "Spend a streak coin to play another" or "Save it for another day". The menu has a Streak coins section.
- Spending a coin starts a bonus game: 3 questions never seen on this device (2 regular + 1 Doha life), stored as `tk8-b<day>-<n>`, active pointer `rq-active`. Bonus games never touch streak, stats, server answers, sync, challenge links or group scores. Coins are device-only for now.
- Popups (`#sheet`) are full screen on phones and one fixed 520px modal on desktop. `fitSheet()` is a no-op on purpose.
- Groups: `submitDay` now returns success, retries (4s, 15s, 60s), remembers failures in `rq-gdirty`, retries on reconnect/reopen, and also back-fills yesterday's finished score (the rules allow today and yesterday only).
- Results page: when the player has coins, a red button (`.spendb`, vibrates every few seconds, respects reduced motion) says "Spend a coin to play another". With 0 coins nothing is shown. The menu only shows the coin count and rule.
- Pop-ups (`popup()`): a one-time thank-you gift of 2 coins for existing players (`rq-gift`: p pending, d done, n new visitor so no gift; decided on the first load after this build by whether the device already had Roughly data), and a "You earned a streak coin" message with a "Don't show me this again" checkbox (`rq-nocp`).

## Live player data, group boards, dated bonus (10 Nov 2026)
- All demo/placeholder data is gone (`DEMO`/`demoDist` removed). The score curve, "Better than X%" and "Top X%" come only from real players, and only once `MINN`=30 people answered. Source: the node backend if `roughly-api` is set, otherwise the Firestore `answers` collection (`RQGroups.submitAnswer/qStats/dayStats`). Without either, an honest "coming soon" note is shown. The `answers` rules in `backend/firestore.rules` must be published in the Firebase console or writes are refused.
- Group board shows Today and Week columns, with a Total / Average / vs group toggle (`rq-gmode`). vs group is each member's average against the mean of members' averages.
- "Spend a coin to play another" is shown to everyone on the results page; with 0 coins it opens an explainer pop-up instead. A bonus game now serves the most recent past drop the player hasn't played (stored as `bd` on the bonus state) and the results page names its date. Pre-11 Nov drops are rebuilt from `legacyPick` on the current pool, so they may not match what was originally dropped.

## Chart box and bonus-date fixes (10 Nov 2026)
- The results/reveal chart container id is `cbox` (was `gbox`, which collided with the Groups board `gbox` and made group scores render inside the score card). Never reuse `gbox` for charts.
- Bonus games fetch stats for their source drop (`st.bd`), so the reveal curve and results chart work in bonus mode.
- `.bdate` ("9 Nov drop") is absolutely positioned top-right of the score card; `.rtop.nochart` / `.revrow.nochart` collapse to one column when there is no chart data.

## Graphs show early data, smooth group toggle (10 Nov 2026)
- `MINN=1`: the chart shows as soon as one real player answered. Under `EARLY=30` players the note starts "Early numbers."; under 5 players the "Better than X%" line and "Top X%" pill are hidden (a percentile of 2 people is meaningless). With zero answers a visible "unlocks" note shows (not hidden).
- `openGroup(id,cb)`: toggling Total / Average / vs group repaints from the already-loaded board (`cb`) with no reload, no "Loading" flash.
- `chartLater` retries up to 3 times (2.5s, 5s, 7.5s) while a chart has no data yet, because on a reload the answers backfill (`RQ_answers` -> `submitAnswer`) can finish after the first stats fetch. Keeps "Loading…" while retrying.

## Reveal graph: guesses on a real-number axis (10 Nov 2026)
- The per-question reveal graph (`drawGuessGraph`, `.dg*` CSS) replaces the score-distribution curve. Pale bars = what all players answered, on a log axis from 0.25x to 4x of our estimate (labels in real units via `short()`), left = too low, right = too high. The bar at the correct answer (bin 12 of 25) is green with a "Correct answer" tag. Your dot ("You") has a dashed stem; it is clamped to 7%..93% so it always stays inside the plot, with "(off the chart)" in the legend if your guess is beyond 4x.
- Data: answers already store `r` = log10(guess / estimate). `RQGroups.qStats` and the node `stats()` now return `rb` (25 bins of `r`, outliers clamped into the end bins). Without `rb` (older backend) the old curve is used. The results-screen day graph is unchanged (score distribution).
- Score is symmetric (20% high and 20% low both score 94) which is why the old graph put both at the same x. The new graph plots direction.
- Live font is Plus Jakarta Sans (IBM Plex Sans Arabic for Arabic), not Fredoka.
