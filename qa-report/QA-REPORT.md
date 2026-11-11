# Roughly Qatar: QA report

**Tested:** live site https://www.roughly.gg, build `2026-11-11.12` (byte-identical to `main` at `4a5cb33`), on 11 Nov 2026.
**Devices:** iPhone 13 emulation (390x664 viewport, Asia/Qatar time zone), desktop 1440x900, plus 320x568, landscape 844x390, reduced motion and a New York time zone.
**Safety:** every test swapped the Firebase SDK for in-memory fakes and blocked the Google backend hosts. No answers, scores or groups were written to production, and nothing was deployed.

## Severity scale

| Severity | Meaning |
|---|---|
| **High** | Breaks a core promise (same questions for everyone, honest scoring, correct answers) or creates real cost or data risk. Fix before the next content or traffic push. |
| **Medium** | Visible defect or confusing UX that most players will hit, or a latent risk. Fix soon. |
| **Low** | Polish, rare edge cases, copy. |

## What works

- A full game plays cleanly on mobile and desktop with **no console errors**.
- Scores match the formula exactly: 2x off = 80, 10x off = 26, spot on = 100, never 0. All 193 active questions score 100 at their own estimate.
- Unit switching converts correctly: answering in miles, USD or minutes scores 100 at the estimate.
- Double-tapping Confirm records one guess.
- Reloading on a reveal returns to the same reveal.
- Challenge links:
  - open straight into the game with "Sara challenged you";
  - show no answers before you play;
  - show head-to-head at the end;
  - survive the `/Qatar` redirect;
  - strip HTML out of names (an `<img onerror>` name is neutralised).
- Self-challenge links are ignored.
- The streak coin is awarded on day 3, and a bonus game doesn't change streak or played count.
- Social tags (og/twitter, 1200x630 banner) are present.

## Findings

### High

**H1. Appending questions reshuffles the whole schedule, including today**
`pick()` shuffles the full question pool, so the pool's size decides every day's drop.
- **Proof (current rotation):** `tests/append.js` adds 2 questions in the live page. Today's drop changes from `168,177,193` to `182,168,194`, and so do all 60 following days.
- **Proof (it already happened):** under the old picker, every past day changed when batches were added on 6 and 11 Nov. Production served #145, #62, #129 on 10 Nov. The live code now says 10 Nov was #14, #174, #193 (`tests/legacy.js`).

Impact:
- Deploying a question batch mid-day gives different players different questions on the same day.
- Challenge links then compare scores on different questions.
- Per-question stats split across two sets.
- The "fresh questions first" ordering is based on a re-computed history, not what players actually saw.
- The bonus game's "9 Nov drop" isn't what dropped on 9 Nov.
- `CLAUDE.md`'s "append only keeps indices stable" protects saved games, but not the schedule.

Fix: freeze the schedule. For example, store an explicit list of daily question ids, or only let new questions enter from a future cycle. Make `append.js` report 0 changed days before shipping a batch.

**H2. "Top X%" and "Better than X% of players" are calculated against invented players**
`DEMO_FILL=true` adds ~160 generated "sample" players to every chart, and the percentile is computed on that mix. The sample players score high, so ordinary results look bad:
- a 69% day shows **"Top 91%"** and **"Better than 9% of players"** (`m-11-results.png`);
- an 8% day shows **"Top 99%"** (`e-04-head-to-head.png`).

"Top 91%" also reads as praise when it means bottom 10%. The yellow "Sample data" label is on the graph, not on the headline number. This conflicts with "Challenge, don't punish" and with "never show invented numbers".

Fix: compute the percentile from real players only, and hide it until there are about 30 of them. Phrase it as "Better than X%" (drop "Top X%"), or show only when it flatters.

**H3. Player stats will get expensive fast (reads grow with the square of players)**
- Every reveal calls `qStats`, which reads every answer doc for that question (up to 5,000).
- The results and Home screens each call `dayStats`, which reads all three questions' answers.
- That's about 9 x N document reads per player per day, so about 9 x N² in total:
  - 1,000 players a day is about 9M reads a day;
  - 5,000 players is about 225M reads a day, which is roughly USD 70-135 a day at Firestore read prices, every day, from one viral spike.
- The `limit(5000)` cap also makes stats wrong once a question passes 5,000 answers.

Fix: keep running counters (an aggregate doc per day and question, updated with increments), or use Firestore `count()`/aggregation queries.

**H4. Wrong facts and broken reasoning in revealed answers**
See the question report for detail:
- #176 says 63 million km is "Earth to the Sun and back a few times". The Sun is 150 million km away.
- #46 says 76 km is "further than the drive to the Saudi border". It's about 90 km or more.
- #39 uses QAR 1.5 a litre for fuel. Pump prices are about QAR 2.
- #145 counts arrivals as boarding passes, so it's about 2x too high.
- #100 does 300 / 1.7 and gets 190. It's 176.

The brief says every answer is explained with simple reasoning, so a wrong explanation undermines trust the moment a player checks.

**H5. Duplicate questions that contradict each other, scheduled about a week apart**
- #161 and #177 (street lights): 200,000 vs 350,000 on the same 10,000 km of road. They're 8 days apart, and #177 dropped today.
- #164 and #178 (coffee at Hamad Airport): 60,000 vs 37,000. #178 drops on 15 Nov, 4 days from now.

**H6. The same wording means "one person" in some questions and "the whole country" in others**
- "How many times a day does someone say 'yalla'?" has a per-person answer: 40.
- "How many times a day does someone say 'five minutes'…?" has a national answer: 900,000.
- Six questions read as per-person but score a national total: #32, #117, #122, #127, #129, #131.

A player who reads them literally scores about 1%. That's the biggest fairness issue in the bank.

### Medium

**M1. Time zones: a challenge from Doha is ignored abroad, and "same three questions" depends on the clock**
The drop changes at each player's local midnight.
- A link sent at 01:00 Doha time, opened in New York (still the previous day), is silently ignored: no banner, no head-to-head.
- Friends in different time zones play different questions at the same moment.

Fix: use Doha's date for the drop everywhere, or accept a challenge for today + 1.

**M2. Screens don't fit one phone screen, against the design rule**
Measured on the iPhone 13 viewport (664px tall):

| Screen | Page height | Screenshot |
|---|---|---|
| Reveal 1 | 689px (top of card cut off) | `m-05` |
| Reveal 3 | 684px | `m-09` |
| Results | 774px | `m-11` |
| Question at 320px wide | 651px vs 568px viewport | `e-09` |
| Question, landscape phone | Confirm button off-screen | `e-11` |

**M3. Desktop shows a phone-sized card in a mostly empty 1440px canvas**
- Text is small, and the "How to play" step cards squash to one word per line (`d-02`).
- The Groups and menu modals are tall white panels with most of the space empty (`d-14`, `d-15`).
- The sidebar layout described in `CLAUDE.md` is gone.

**M4. "Spend a coin to play another · 0 left" is a permanent red button for almost everyone**
- New players have 0 coins, so the most prominent button on the results and Home screens leads to an explainer pop-up (`e-08`).
- With past drops locked (`ARCHIVE_OPEN=false`), the only "one more" route is a 3-day streak. That leans towards weaponising streaks and works against "always wants one more".

**M5. Stats can be faked or spammed**
- The `answers` rules accept any score `s` without checking it against `r`.
- They don't check that `qi` is in that day's drop.
- Anonymous accounts are unlimited, so one script can fill a day's averages.
- Fine for now; not fine once groups or percentiles matter.

**M6. "Players' average" shows your own score**
When you're the only player, Home shows "Players' average 69% · 1 player" next to your own 69% (`m-13`). Hide it until there are a handful of other players.

**M7. Finishing after midnight counts for yesterday, and the countdown says the next drop is a day away**
- Started at 23:58, finished at 00:05: the game saves under the previous day.
- The countdown says "Next drop in 23:56:56" while a new drop is already available.
- The app only moves to the new day after the tab loses and regains focus.

**M8. Owner "Dev" tools are listed in the public menu**
- "Dev · Locked. Owner tools." is visible to every player (`m-14`).
- The code comment admits it isn't real security: the gift key is in the page source, so anyone can forge gift links.
- The impact is small because coins are device-only and editable in local storage anyway. Hide it behind a URL flag.

### Low

| ID | Finding | Evidence |
|---|---|---|
| L1 | `1e5` becomes `15` and `-5` becomes `5` silently. `0` can't be entered, which matters for Facts where a player believes the answer is none. Huge guesses show "1000000 billion" and "51440329x too high". | edge log, `e-10` |
| L2 | A typed but unconfirmed guess is lost on reload. | edge log |
| L3 | Bad challenge and group links are silently ignored, and `?c=…` stays in the address bar. | edge log |
| L4 | No favicon, apple-touch-icon or manifest (all 404). Tabs and home-screen shortcuts get a generic icon. | curl |
| L5 | Units are capitalised mid-sentence ("Enter a number in Eggs"). Ten titles say "kilometres" while the player may answer in miles. | `m-03`, `e-02` |
| L6 | The share box cuts the link off. WhatsApp is a small secondary button under "Copy to clipboard". | `m-12` |
| L7 | "No exact answer" is shown on questions that have one (#185 goals, #46 metro length, #150, #13). #186 is in Facts but tagged Rough estimate. | question report |
| L8 | The bonus banner truncates: "Bonus game · questions from the 9 Nov…". | `e-06` |
| L9 | The reveal graph pins far-off guesses at the edge of the axis, outside its labels. | `m-07`, `e-10` |
| L10 | `CLAUDE.md` is out of date: font (Plus Jakarta Sans, not Fredoka), landing page vs Home, a "33 questions" check, the desktop sidebar, a "no demo data with backend" rule. Future QA will test against the wrong spec. | |

## Scoring review

- **Formula:** sound for "how many" questions. 1.5x off = 92, 2x = 80, 3x = 61, 5x = 42, 10x = 26, 100x = 8, 1000x = 4.
- **Celsius:** temperatures aren't a ratio scale. On #191, guesses of 16°C and 30°C both score 94-96.
- **Facts:** the log scale is too forgiving for small exact counts. Answer 8 municipalities: a guess of 6 or 10 still scores 96-97. Answer 1: a guess of 2 scores 80. Consider exact-or-off-by-one scoring for the Facts category.
- **Plausible ranges:** only 3 questions have range edges scoring under 50 (#188, #194, #2). Range widths are otherwise consistent.

## Not tested

- Real iOS Safari and Android Chrome. The tests used Chromium emulation, so `navigator.share` ("More options") never appeared, and Safari-specific layout wasn't checked.
- Real Firestore. Rules, cost and live percentiles were reviewed from code only.
- WhatsApp's own link-preview rendering. I checked the tags it reads, not the app itself.
- Google sign-in.
- Group flows beyond opening the sheet, which were covered in the previous round.
- Load or performance under real traffic.
