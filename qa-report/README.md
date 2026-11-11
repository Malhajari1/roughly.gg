# Roughly Qatar: QA and product review (11 Nov 2026)

Independent test of the live site (build `2026-11-11.12`) on mobile and desktop, plus a full audit of the 198-question bank. Nothing was changed on the site, in the data or in the scoring. All tests used a fake in-memory Firebase, so no test answers reached production.

| File | Contents |
|---|---|
| `QA-REPORT.md` | Bugs and UX issues with severity (6 High, 8 Medium, 10 Low) |
| `QUESTION-QUALITY.md` | Duplicates, repeats, wrong answers, ambiguity, units, verifiability, with examples |
| `question-audit.csv` | Every question with its estimate, range and any flag (45 flagged) |
| `screenshots/` | 45 screenshots: mobile (`m-`), desktop (`d-`), edge cases (`e-`) |
| `tests/` | The reusable harness (Playwright + fake Firebase). Run it before each deploy. |

## The short version

The core game is solid: it plays start to finish with no errors, the scoring maths is right, units convert correctly, and challenge links work and never spoil answers. The problems are in five places:

1. **Schedule integrity.** Adding questions silently reshuffles every day's drop, including today's. It has already rewritten past days twice.
2. **Honesty of the comparison numbers.** "Top 91%" and "Better than 9% of players" are calculated against invented sample players, and they make normal scores look bad.
3. **Content accuracy.** 5 wrong facts or calculations in the explanations, 2 contradicting duplicate pairs, and 6 questions whose wording doesn't match their answer (per person vs the whole country).
4. **Cost at scale.** Player stats read every answer on every screen, so Firestore reads grow with the square of the number of players. A viral day could cost real money.
5. **Fit and polish.** Reveal and results screens overflow an iPhone 13. Desktop is a small card on an empty page. A red "Spend a coin · 0 left" button is shown to almost everyone.

## Sharing review

**What works:** challenge links skip straight into the game, the banner names the friend, no answers leak, head-to-head shows at the end, the `/Qatar` link preview has a proper banner, and links survive the redirect.

**What holds referrals back:**
- **The message gives friends no reason to tap.** It reads "I just played today's Roughly Qatar. Think you can beat me? … no spoilers" plus a link: no score, no question, nothing to react to in a WhatsApp chat.
- **WhatsApp is a small secondary button**, under a big "Copy to clipboard". The name field comes first. The message box cuts off the link.
- **The loop ends at head-to-head.** There's no "send your score back to Sara" and no "start a group with Sara".
- **Links from Doha opened abroad can be ignored entirely**, because of the time-zone issue (QA M1).

**Ideas that keep it simple** (no new dependencies, no emojis):
1. **Put a hook in the text:** score, per-question line and the first question as a teaser:
   `Roughly Qatar · 11 Nov — I got 69%`
   `80 · 26 · 100`
   `Q1: How many eggs does Qatar eat every day? What would you guess?`
2. **Make WhatsApp (or the phone's own share sheet) the main button.** Move the name field below it and prefill it from the group name.
3. **After head-to-head, add a "Send your result back to Sara" button.** Each challenge then becomes a two-way thread instead of a dead end.
4. **On the recipient's first question, say "Sara has played. Her score unlocks when you finish."** It builds anticipation without spoilers.
5. **On a wildly wrong reveal, offer "Ask a friend"** with a no-spoiler message: "I was 10x off on this one. What would you guess?" This is the brief's "What would YOU have guessed?" moment.

## Daily loop review

**What's there:**
- a fresh drop daily, with a countdown;
- streak and week strip on Home;
- weekly group leaderboards;
- streak coins, each unlocking a bonus game of three questions from a missed day.

**Where it fights the brief:**
- **"Always wants one more".** Past drops are locked (`ARCHIVE_OPEN=false`), so the only extra game is earned with a 3-day streak. That's mild streak pressure, which the brief says to avoid. Meanwhile a permanent red "Spend a coin · 0 left" button nags new players.
- **"Social comparison after answering".** It's currently against fake players (QA H2), and "Players' average" shows your own score when you're the only player.
- **Content runway.** Doha-life questions start repeating on **30 Dec**. Staying repeat-free needs about 21 new questions a week, or the schedule fix plus accepting the cycle.

**Simple retention ideas:**
1. Open past drops freely, or give everyone one free past drop a day. Keep coins as a bonus, not a gate. Hide the coin button at 0.
2. Show one honest insight after about 7 games: "You tend to guess too low, by about 2x". The data (`r`) is already stored. A single line, no new screen.
3. Show a teaser for tomorrow, for example tomorrow's category icon next to the countdown. It costs nothing and creates a reason to come back.
4. On Sundays, show last week's group winner on Home: a natural reason to open the app as the board resets.

## Prioritised improvements

**P0: before the next question batch or any promotion**
1. **Freeze the schedule (H1)** so appending questions can't change today or past days. Gate releases on `tests/append.js` reporting 0 changed days.
2. **Stop computing "Top X%" and "Better than X%" from sample players (H2).** Hide them until about 30 real players, and drop "Top X%" wording for low scores.
3. **Fix the 5 factual or calculation errors** (#176, #46, #39, #145, #100) **and the #83 contradiction.**
4. **Retire one question of each duplicate pair (#161/#177, #164/#178).** Rewrite the 6 per-person vs national titles (#32, #117, #122, #127, #129, #131) with "across Qatar" or "the average person".

**P1: this week**

5. **Replace per-view stat reads with running counters (H3).** Tighten the `answers` rules (M5).
6. **Make reveal and results fit an iPhone 13 screen (M2).** Check 320px and landscape.
7. **Hide the 0-coin button (M4) and the Dev menu item (M8).**
8. **Rework the share message and buttons** (ideas 1-3 above).
9. **Use Doha's date for the drop**, or accept challenges for today + 1 (M1).

**P2: next**

10. **Desktop layout (M3):** wider cards, a sensible modal height, and no squashed How-to-play.
11. **Small fixes:**
    - Players' average with 1 player (M6);
    - midnight countdown (M7);
    - favicon and home-screen icon (L4);
    - input edge cases (L1);
    - unit wording and capitalisation (L5).
12. **Scoring for Facts and °C:** exact or off-by-one scoring for Facts, a degree-based score or retirement for #191. Allow 0 where it's a real answer.
13. **Add a `src` field** to Derived and Official questions. Re-tag the checkable "Rough estimates".

**P3: later**

14. **Content pipeline:** about 21 questions a week, more variety of reasoning, and a "just for fun" label for unanswerable jokes.
15. **Retention ideas** 1-4 above. Update `CLAUDE.md` so future QA tests against the current design.

## Screenshots

**Mobile, full game (iPhone 13):**

| File | Screen |
|---|---|
| `m-01` | First visit (goes straight to Q1) |
| `m-02` | How to play |
| `m-03`, `m-04` | Question, empty and typed |
| `m-05`, `m-07`, `m-09` | Reveals: 2x high, 10x low, spot on |
| `m-06` | See the maths |
| `m-11`, `m-11b` | Results |
| `m-12` | Share sheet |
| `m-13`, `m-13b` | Home dashboard |
| `m-14` | Menu |
| `m-15` | Groups |
| `m-16`, `m-17` | Arabic Home and results |

**Desktop:** `d-01` to `d-15`, the same flow at 1440x900.

**Edge cases:**

| File | Screen |
|---|---|
| `e-01` | Huge input |
| `e-02` | Answering in miles |
| `e-03`, `e-04` | Challenge link and head-to-head |
| `e-05` to `e-08` | Streak coin earned, bonus game, bonus results, 0-coin pop-up |
| `e-09`, `e-10` | 320px question and reveal |
| `e-11` | Landscape phone |
| `e-12` | Good to know |
| `e-13` | Calculator |
