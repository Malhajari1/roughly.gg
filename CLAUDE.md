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
- The per-question reveal graph (`drawGuessGraph`, `.dg*` CSS) replaces the score-distribution curve. Pale bars = what all players answered, on a log axis from 0.1x to 10x of our estimate (ticks 0.1/0.3/1/3/10x) (labels in real units via `short()`), left = too low, right = too high. The bar at the correct answer (bin 20 of 41) is green with a "Correct answer" tag. Your dot ("You") has a dashed stem; it is drawn at its true position (the axis maps into the inner 6%..94% of the plot so the dot is never clipped); beyond 10x it sits on the edge with "(off the chart)" in the legend.
- Data: answers already store `r` = log10(guess / estimate). `RQGroups.qStats` and the node `stats()` now return `rb` (41 bins of `r` over +-1 decade, outliers clamped into the end bins; the correct-answer bin is index 20). Without `rb` (older backend) the old curve is used. The results-screen day graph is unchanged (score distribution).
- Score is symmetric (20% high and 20% low both score 94) which is why the old graph put both at the same x. The new graph plots direction.
- Live font is Plus Jakarta Sans (IBM Plex Sans Arabic for Arabic), not Fredoka.

## Reveal graph is data-fitted (10 Nov 2026, build .11)
- Supersedes the fixed 0.1x-10x axis above. `drawGuessGraph` now fits the axis to the players' answers: from the 2nd to the 98th percentile of `r` plus the correct answer (0), minimum span 0.6 decades, 6% padding, 30 bins. No long runs of empty bars. Ticks are round numbers (1/2/5 x 10^k) that fit, plus the green answer tick.
- "You" is inside the axis when within a quarter-span of the data (axis grows slightly to include it); otherwise it sits on the edge and the legend says "off the chart". The green bar is always the bin containing the answer, drawn as a thin stub if nobody guessed there.
- Data: `rs` = array of rounded `r` values per question (Firestore `qStats` and node `stats()`, capped at 5000). It replaces `rb`. Without `rs` the old score curve is used.
- Tested with stand-in data in Playwright (tight, wide, 1-3 players, outliers, far-off guess, Arabic, 360/393/1280). Not yet seen with real Firestore answers.

## Reveal graph: answer always centred (10 Nov 2026, build .12)
- The axis is now symmetric around the correct answer (half-width = the larger of the players' 2nd/98th percentile distance, min 0.3 decades, +6%), so the green bar and tag are always at 50%. Too-low sits left, too-high right. The "You" extension is symmetric too. Trade-off: a lopsided crowd leaves empty bars on the quiet side.

## Seamless reveal transition (10 Nov 2026, build .13)
- Bug: the reveal first rendered a side-by-side score/"Loading" layout, then swapped to the stacked graph layout when stats arrived, so cards jumped ~90px and the buttons dropped mid count-up.
- Fix: `reveal()` renders `.revrow.dg` (final layout) from the first frame, with `qSlot()` as a graph slot the same size as the finished graph (shimmering `.dgp.ld`, legend min-height). The graph builds inside it; "unlocks"/"coming soon"/error notes (`qNote`) show inside the same slot, so nothing collapses. The graph animation waits ~750ms from `revT0` so the score hit lands first.
- Short screens (max-height 740px) use a smaller plot. At ~667px tall the page still scrolls ~45px (top bar plus margins); not fixed.
- The old score-curve fallback (no `rs`) still swaps in at its own size; only matters for an old backend. Results-screen chart still uses `noChart()` collapse.
- Measured by sampling element positions every 40ms with the stats delayed 40ms/700ms/1.8s/never: layout changes once (first paint) and never again.

## Spot-on is dead centre (10 Nov 2026, build .14)
- The reveal graph uses 31 bins (odd) so one bin is centred on the correct answer; with 30 the green bar sat ~5px right of centre. A guess within 3% ("Spot on") snaps the You dot and dashed line to the exact centre. Measured 0px offset for line, dot, tag and green bar at 393px.

## Coin stack icon, Dev tab, gift links (10 Nov 2026, build .15)
- `ICON_COIN` is now a flat-colour gold coin stack (explicit fills, so the `.mi`/`.popi` stroke rules don't recolour it). Old dollar-sign outline removed. `.popi svg` is 42px.
- Menu has a "Dev" row (`data-act='dev'` -> `openDev()`), locked by a code the owner chose. Only a hash (`DEVH`, `h53`) is in the file, not the code itself. Unlock lasts for the page session only (`devOK`), 5 wrong tries lock it until reload.
- Unlocked: add coins to this device (cap 99, like the rest of the code), reset to 0, and make a gift link for another player.
- Gift link: `<site>?gift=<n>.<id>.<sig>` (n 1..20, 6-char id, `giftSig` = hash of n, id and `GKEY`). Opening it shows "A gift for you"; Claim adds the coins once per device (ids kept in `rq-gifts`). The param is stripped from the URL and the link skips the landing page. Reused link says "Gift already claimed". Wrong amount or signature is ignored silently.
- NOT real security: the hash and `GKEY` are in client code, so anyone willing to read the source can open the Dev tab or forge a gift link. Coins are device-only and never touch streaks, stats, boards or server answers, so the worst case is a free bonus round. Real protection would need the node backend to sign gifts.
- Tested in Playwright (localhost): wrong code, unlock, add 3, lockout after 5 tries, gift link claimed by a fresh browser profile, reuse blocked, forged amount and made-up signature rejected. Not tested: Arabic gift pop-up on a real device, the clipboard Copy button on a phone.

## Sample answers are back, in yellow (10 Nov 2026, build .17)
- OVERRIDES "no invented numbers" while `DEMO_FILL=true` (a flag next to `MINN`). Set it to false to remove all sample data with no other change.
- `mixStats()` (called from `fetchStats`) tops each question up to ~140-200 answers and each day up to 160 players with seeded fake ones (`demoQ`, `demoDay`; same on every reload). Real answers always show and replace samples one for one, so samples fade out as real players arrive. Also used when the backend is unreachable.
- Reveal graph: sample bars are yellow (`#ffd84d`) stacked under the pale real bars, legend entry "Sample data" (`o.fs` = sample r values, `o.rs` = real). Results chart: yellow sample part of each bar (`CD.fb`), and the note says "Includes N sample answers, shown in yellow."
- "Better than X%" and "Top X%" are computed from real + sample, so they are not true while samples are on. Turn `DEMO_FILL` off before telling players those numbers are real.
- Tested in Playwright: sample-only and real+sample, all three questions plus results, no console errors. Not tested with real Firestore data.
