# Roughly QA harness

Browser tests that run against the **live site** without touching production data.
`fakefb.js` swaps the Firebase SDK (gstatic) for in-memory fakes and blocks every other
Google backend host, so no answers, scores or groups are written to the real Firestore.

Needs Node 18+ and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`).

| Script | What it does |
|---|---|
| `e2e.js [mobile,desktop]` | Plays a full game (guesses 2x high, 10x low, exact), checks scores, opens every sheet, saves screenshots to `../screenshots/` |
| `edge.js` | Edge cases: input validation, units, double-submit, reloads, challenge links, time zones, midnight, streak coins, bonus game, 320px, landscape, social tags |
| `dump.js` | Pulls the live question bank + 400-day schedule into `bank.json` for auditing |
| `append.js` | Proves whether appending a question changes today's / future drops |
| `legacy.js old.html new.html day,day` | Compares the drop a past build served with what the current build computes for the same days |

Run before every deploy that touches questions, scoring, sharing or the daily loop:

```
node e2e.js && node edge.js && node append.js
```

`append.js` must report `changed: 0` before a question batch ships (see QA report, issue H1).
