# Authentication and streak audit (17 Nov 2026)

**What was tested:** the live build `2026-11-11.12`, which is the code on `main`.
**How:** Playwright with a controlled clock and a fake in-memory Firebase. Nothing touched production.
**Script:** `tests/streak-audit.js`.

## 1. How sign-in works today: two competing flows

| | Flow A: email code | Flow B: Firebase (Groups) |
|---|---|---|
| Where | Menu, then "Sign in" | Groups board, "Sign in with Google to save your spot" |
| Backend | `backend/server.js` (Node): `/auth/start`, `/auth/verify`, `/sync` | Firebase Auth (anonymous, then Google via `linkWithPopup`) |
| Live? | **No.** It only works if `<meta name="roughly-api">` has an address, and it's empty. So the menu says "Sign-in isn't switched on yet". | **Yes.** Every visitor is signed in anonymously in the background. |
| What it was meant to keep | Day results (`tk8-s*`) through `/sync` | Only the Firebase user ID, so the player keeps their group seats |
| Streak, coins, history | Would have been rebuilt from synced days | **Not stored anywhere in the cloud** |

The menu and Groups page contradict each other because they're **two different systems**. One is switched off. The other works but saves nothing except group membership.

Even a player who signs in with Google today **loses their streak, coins and history** on a new device. Only their group membership follows them.

Other findings:
- If the Google account was already used elsewhere, the code switches to that account (`signInWithPopup`). The old anonymous user stays in each group as a duplicate "Player" row, because the rules only let users remove themselves.
- There's no way to sign out of the Google account anywhere in the app.
- Google refuses sign-in inside some in-app browsers (Instagram, Facebook). WhatsApp on iOS opens Safari, which works. No message tells the player why it failed.

## 2. How streaks work today

- All of it lives on the device in `tk7-stats` `{streak, last, played, total}`, updated when the third answer is locked.
- Streak +1 if `last` was yesterday, otherwise 1. A coin when the streak is a multiple of 3 (`rq-coins.aw` remembers the day it was given).
- "Today" is the **device's local date**, not Qatar's.
- Nothing is checked by a server. The node `/sync` path that could rebuild streaks isn't running.

## 3. Test results

PASS = behaves correctly; FAIL = a real problem; INFO = expected behaviour worth knowing.

| # | Check | Result | What happened |
|---|---|---|---|
| 1 | A finished daily game counts | **PASS** | Streak 1, played 1 |
| 1b | The next day continues the streak | **PASS** | Streak 2 |
| 2 | A bonus game doesn't add to the streak or played count | **PASS** | Unchanged |
| 3 | Only one streak step per calendar day | **PASS** | `last` blocks a second step |
| 4 | A finished game can't be replayed | **PASS** | No answer box is shown |
| 4b | Today's record lost (storage clean-up, tab bug), then played again | **FAIL** | Played count went 3 to 4. Streak and coin unaffected. |
| 5 | Coin on day 3 | **PASS** | 1 coin |
| 5b | Coin not given again on reload or results | **PASS** | Still 1 |
| 6 | Refresh or reopen | **PASS** | Unchanged |
| 6b | Two tabs finishing the same day | **PASS** (by luck) | Played stayed 1 because the second tab overwrote the first |
| 6c | Same player on a second device | **FAIL** | Streak 0. There's no sync in production. |
| 7 | Day and streak follow Qatar's date | **FAIL** | At 22:30 UTC, Doha is on day 20775 and London on 20774, with different questions and different streak days |
| 8 | Game started 23:58, phone unlocked 00:02 | **FAIL** | The app jumps to the new day and abandons the half-played game. Played the 16th, started the 17th, finished the 18th: streak drops to 1. |
| 8b | Started 23:58, finished 00:03 without leaving the tab | **PASS** | Credited to the 17th. The countdown wrongly says "23:56:58" while a new drop is already out. |
| 9 | Finished at 23:59 | **PASS** | Credited that day |
| 10 | Streak kept when linking Google | **FAIL** | Nothing to keep: no cloud copy of streak, coins or history exists |
| 11 | Displayed streak matches stored | **PASS** | After a missed day the screen says 0 while storage still says 3 until the next save. Harmless. |
| 12 | A missed day resets the streak | **PASS** | Shows 0 before playing, 1 after |
| 12b | Unexpected resets | **FAIL** (from 7 and 8) | Device time zone or clock changes, and the midnight case above |

| Other checks | Result | What happened |
|---|---|---|
| Losing the connection while finishing a game | **PASS** | Saved on the device first; group scores retry later |
| Refreshing straight after the last answer | **PASS** | Saved before any network call |
| Two requests at once giving two rewards | **PASS** for coins | The coin is tied to the day. Played and total can lose an update between tabs. |
| Editing local storage | **INFO** | Setting the streak to 98 and finishing gave 99 and a coin. The client is fully trusted. |
| Server-side calculation | **INFO** | None |
| Recovery when an update fails | **INFO** | Nothing to recover on the device. Across devices, nothing exists. |

## 4. What this means

- **Streaks are fair on one phone in Qatar.**
- **They break across devices** (no sync), **for players outside Qatar's time zone**, and **when a phone is unlocked just after midnight mid-game.**
- **Sign-in is confusing** (two flows) and **gives nothing back:** Google keeps group seats only.
- **Anyone can edit their streak and coins.** That only matters for bonus rounds on their own device, since nothing competitive depends on streaks.

The fixes are in `IMPLEMENTATION-PLAN.md`, sections 3 and 4.
