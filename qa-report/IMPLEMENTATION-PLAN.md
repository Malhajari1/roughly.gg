# Implementation plan: Firebase efficiency, sign-in, streaks, Dev page, groups

**Status:** proposal only. Nothing is built or deployed yet.
**Baseline:** live build `2026-11-11.12`, plus the undeployed schedule and content fixes on this branch.
**Goal:** stay on the free Spark plan for as long as possible, with no change to how the game looks or plays, unless a change is listed in section 9 for approval.

---

## 0. Urgent: the current setup is probably already near its free limit

Every reveal, results and Home view reads **every answer** for the day. That's about 9-12 x N reads per player per day, so about 10 x N² in total:

- **About 70 players a day uses up the free 50,000 reads.**
- After that, every Firestore read fails until 11:00 Doha time (midnight US Pacific, when the quota resets).
- The "Couldn't load the players' average" errors may already be partly this.

The players' graphs hide it: when a read fails, they quietly fall back to sample data.

**Recommendation:** ship the stats part of this plan first.

---

## 1. Recommended architecture: high-volume data in Realtime Database, groups stay in Firestore

### Why this is fundamentally cheaper

Firestore's free tier limits **operations** (50k reads and 20k writes a day). Even perfectly optimised, a game with integrity checks needs about 2.5 writes per finished game, which caps us at about 7,800 finished games a day.

Firebase **Realtime Database (RTDB)** on Spark has **no read or write operation limits**. It's limited only by:
- 1 GB stored;
- 10 GB downloaded a month;
- 100 simultaneous connections.

We'd use its plain HTTPS (REST) interface with `fetch()`:
- no new library;
- no permanently open connection;
- each request holds a connection only for its few hundred milliseconds.

It also returns compact JSON. The same day of stats is **3.7 KB in RTDB vs 12.2 KB in Firestore** (measured, section 2).

### What goes where

| Data | Today | Proposed | Why |
|---|---|---|---|
| Daily stats (answer histograms, score spread, players' average) | Firestore `answers`, one doc per answer, all read on every view | **RTDB `/s/{day}`**: one small node per day, updated with server-side increments | 1 write and 1 read instead of N reads |
| Player profile (last day counted, completed days, coin ledger, name, Google email) | Device only | **RTDB `/p/{uid}`**: tiny for anonymous players (66 B), about 14 KB/year for Google players | Cross-device sync; also the "counted once" marker |
| Admin data (grants, gift links, activity log, admin list) | Hard-coded hash in `index.html` | **RTDB `/admins`, `/p/{uid}/g`, `/gifts`, `/log`**, protected by rules | No secrets in the page |
| Groups (membership, names, owner, removed list) | Firestore `groups` | **Firestore**, kept: group doc + new weekly summary doc | No risky migration of existing groups |
| Group weekly scores | Firestore `scores`, one doc per player per day, all read per view | **Firestore `groups/{g}/weeks/{weekStart}`**: one doc with each member's total, days and last day | 2 reads per board instead of members x 7 |
| Site hosting | GitHub Pages | GitHub Pages (unchanged) | Firebase Hosting's free tier (360 MB/day) would be 8x smaller |

**Existing data:**
- Firestore `answers`, `scores` and `members` stay where they are, untouched.
- `answers` simply stops receiving new writes.
- Current-week group totals start in the new weekly docs **from a Sunday**. Cutting over on a week boundary means no totals need migrating. Older weeks stay readable in the old `scores` docs.

### One finished game = one atomic request

When the third answer is locked, the game sends one multi-path `PATCH` to RTDB. It sets the profile's last-counted day and adds the bins to `/s/{day}`. The RTDB rules accept it only if:

1. **Counted once:** the profile's last-counted day changes from an earlier day to `{day}`. A refresh, retry or second tab is rejected.
2. **Dated correctly:** `{day}` is today or yesterday by the server clock (`now`).
3. **No inflation:** every histogram bin, counter and total goes up by exactly 1 (or by exactly the player's own average for the total).
4. **Can't touch other bins:** the bins changed are the ones named in the player's own entry for that day.
5. **Score matches answer:** each score is consistent with its answer (checked with arithmetic in the rules).

Then, for each group the player is in, one Firestore write adds their average to the weekly doc. It's accepted only if that member's `last day` field wasn't already today (counted once per group per day) and the player is still a member.

**If the request fails** (offline, tab closed): the game is already saved on the device, as today. A small "pending" record retries on the next load or reconnect. Retrying is safe because the rules ignore a second attempt for the same day.

### Bottleneck under a sudden spike

There isn't a single-document bottleneck in this design:
- RTDB applies server-side increments without the per-document write cap Firestore has, so the stats node doesn't need splitting into counters.
- Even at the maximum scenario below, peak traffic is about 2-3 RTDB requests a second, each lasting about 0.3 s. That's about 1 simultaneous connection out of the 100 allowed, so a 50x spike still fits.
- Each Firestore group-week doc only receives writes from that group's members.

**To verify before building:** the 100-connection limit is documented for live RTDB connections. I'll confirm how short REST requests count with a load test on a free staging project (section 8).

### Option A for comparison: Firestore only

The same ideas built entirely in Firestore: a profile marker doc, 2-3 stats counter docs per day, weekly group docs.
- **Works, but caps at about 7,800 finished games a day**, limited by writes.
- **Simpler:** one database instead of two.
- **Use it** if you'd rather not enable a second Firebase product.

---

### Data location (decided 18 Nov 2026)

Realtime Database is only offered in the US, Belgium and Singapore, so it goes in **Belgium** (europe-west1). It holds only **anonymous** data: day stats, and the per-day "counted once" records (random ID + three scores).

Everything identifying stays in the **Doha Firestore**:
- Google profiles (email, name, cross-device history, coin ledger);
- admin grants and the activity log;
- groups.

This changes sections 3 and 6: profiles and admin data move from RTDB to Firestore. The extra cost is small: one profile read a day and one write per finished game, for signed-in players only.

## 2. Measured sizes

| Item | Size |
|---|---|
| `index.html` over the network (gzip) | 108,955 B |
| Day stats node, 1,000 players: RTDB vs Firestore encoding | 2,526 B vs 8,485 B |
| Day stats node, 5,000 players | 3,666 B vs 12,152 B |
| Day stats node, 10,000 players | 4,041 B vs 13,249 B |
| Anonymous profile (last day, streak days, coin ledger) | 66 B |
| Google profile with a full year of history | 13,585 B |
| Firestore weekly group doc, 10 members | 1,753 B |

Histogram bins are 0.025 decade (about 6%), as agreed. Stats sizes were generated with the game's own sample-answer model.

---

## 3. One sign-in: Google through Firebase Auth

**Remove Flow A** (email code) from the app; the node backend becomes unused.

**Keep one identity:**
- Every player is anonymous by default, signed in quietly only when needed: their first reveal, groups or a gift. Visitors who never play get no account at all.
- Google is optional and the same everywhere:
  - The menu "Sign in" row opens a short sheet with **"Continue with Google"**.
  - The Groups "save your spot" button calls the same function.
- Once signed in, the menu shows the email and **Sign out**.

| Situation | What happens |
|---|---|
| New player, never signed in | Stays anonymous. Progress lives on the device plus the tiny `/p/{uid}` marker. |
| Anonymous player links a **new** Google account | `linkWithPopup` keeps the same user ID, so nothing moves. The full device history uploads once to `/p/{uid}`. Groups stay as they are. |
| Anonymous player (A) signs in with a Google account already used elsewhere (G) | 1. A is copied into a second, background Auth session (`updateCurrentUser`) while G signs in.<br>2. A records "I am now G" in both databases (`/alias/A` in RTDB, `aliases/A` in Firestore). Only A can write its own alias.<br>3. Signed in as G, the rules (which check that alias) allow merging A's days and coin ledger into G, replacing A with G in each group's member list, and moving A's current-week total to G.<br>4. A's profile is then deleted. No duplicate rows or profiles. |
| Google player on a new device | Sign in, then download the profile, then merge with whatever the device has (union of days). The streak is recalculated from the merged days. |
| Sign out | Firebase sign-out. Clears this device's copy of progress and remembered groups (decision 3 in section 9), so a shared phone doesn't keep your data. The next game starts anonymous. |
| In-app browser where Google refuses sign-in | A clear message: "Open roughly.gg in your browser to sign in". |

**Why this is merge-safe:** progress is stored as **facts**, not counters:
- completed days;
- coin "earned on day X";
- coin "spent on bonus game Y";
- admin grant "Z".

Merging two devices is a union of facts, so nothing is counted twice. Streak, played count, total and coin balance are recalculated from those facts.

**Console checks you'll need to do** (I can't see the Firebase project):
- the Google provider is enabled;
- `roughly.gg` and `www.roughly.gg` are listed under Authorized domains;
- Authentication has **not** been upgraded to Identity Platform. That upgrade adds a 3,000 daily-user cap on Spark.

---

## 4. Streak fixes (same concept, made reliable)

1. **Qatar's date everywhere.** The day number, schedule, streak, countdown and challenge links all use Doha time (UTC+3, no daylight saving).
   - Fixes tests 7 and 12b, and the time-zone challenge bug from the earlier QA report.
   - Visible for players outside Qatar: the drop changes at Doha midnight (decision 2).
2. **Derived, not incremented.** The streak is the run of consecutive completed **daily** days ending today or yesterday, calculated from the completed-days list.
   - Played and total come from the same list.
   - Bonus games are never in the list.
   - This makes replays, two tabs, refreshes and device merges unable to double-count (fixes 4b and 6b).
3. **Nobody loses their current streak at switch-over.** On first load, if the stored streak is longer than the recalculated run (for example from older devices), the difference is kept as a "carry" until the next missed day.
4. **Finish the drop you started.** If a game is part-played when midnight passes, unlocking the phone no longer throws it away. The player finishes it and it counts for its own day, then today's drop follows (fixes test 8). The countdown points to the right drop.
5. **Coins:** awarded when the recalculated streak reaches a multiple of 3 on a day not already in the "earned" list. Exactly once per day, even across devices.
6. **Cross-device** for Google players through the profile (section 3).
7. **Tampering:**
   - Cloud profile rules only accept a new completed day for **today or yesterday by server time**, so a streak can't be backfilled in the cloud after linking. History uploads once, at the first link.
   - The device copy can always be edited by its owner. That only buys bonus rounds on their own phone.
   - Truly server-calculated streaks need Cloud Functions (Blaze), which you ruled out.

---

## 5. Capacity on Spark

**Assumptions** (GA4 will replace them with real numbers):

| Assumption | Value |
|---|---|
| Visitors who start a game | 75% |
| Starters who finish all three | 80% (so finishers = 0.6 x visitors) |
| Page loads per active player per day | 1.3 |
| Finishers in at least one group | 40%, averaging 1.25 groups |
| Players signed in with Google | 20% |
| Daily uniques as a share of monthly uniques | 30% |
| Busiest hour | 12% of the day, 5-minute sessions |

**Cost per finished game after the change:**

| Resource | Recommended (RTDB + Firestore groups) | Option A (Firestore only) |
|---|---|---|
| Firestore writes | 0.53 | 2.53 |
| Firestore reads | 1.5 (groups only; non-members do no group query) | 6.1 |
| Data downloaded | ~10 KB RTDB + ~2 KB Firestore | ~40 KB Firestore |
| Storage per year | about 4 KB/day stats + 66 B per anonymous player + 14 KB per Google player per year | similar, larger encoding |

**Limit per resource:** how many finished games a day each one allows on its own (recommended design).

| Resource | Free quota | Finished games/day it allows | Note |
|---|---|---|---|
| Firestore writes | 20,000/day | 37,700 | |
| Firestore reads | 50,000/day | 32,900 | |
| RTDB download | 10 GB/month | ~35,000 | |
| RTDB storage | 1 GB | Years at this scale | Google profiles are the biggest part; history is compact |
| Firestore storage, data transfer | 1 GB, 10 GB/month | Not close | |
| RTDB simultaneous connections | 100 | ~1 in use at peak | To confirm on staging |
| **GitHub Pages bandwidth** | **~100 GB/month (soft limit)** | **~27,800 visitors, about 16,700 finished games** | **The binding limit** |

**Bottleneck:** static hosting bandwidth (the 109 KB page, about 120 KB per visitor per day). It's a soft limit: GitHub may get in touch rather than cut you off. Moving the static files to Cloudflare Pages (free, no bandwidth cap) would make Firestore group reads the next limit, at about 33k finished games a day.

**Scenarios (recommended design):**

| | Conservative (30% headroom) | Normal (15%) | Maximum |
|---|---|---|---|
| Daily unique visitors | 19,500 | 23,600 | 27,800 |
| Daily active players (start a game) | 14,600 | 17,700 | 20,800 |
| Players finishing all three, per day | 11,700 | 14,200 | 16,700 |
| Finished games per month | 350,000 | 425,000 | 500,000 |
| Monthly unique visitors | ~65,000 | ~79,000 | ~93,000 |
| Peak simultaneous players | ~195 | ~240 | ~280 |

**For comparison:**

| | Writes cap | Conservative | Maximum |
|---|---|---|---|
| Option A (Firestore only) | Writes cap at 7,900 finished/day | 5,500 finished/day (~9,200 visitors) | 7,900 finished/day (~13,000 visitors) |
| Today's code | Reads cap at **~70 finished/day** | | |

**Sensitivity:** each extra group a typical player joins adds about 1 Firestore write and 2-3 reads per finished game. Groups are the part that grows with engagement, so watch them first.

**If a quota is exceeded on Spark:**
- **You're never charged.**
- **Firestore:** requests fail with "resource exhausted" until 11:00 Doha time (10:00 in US summer time) for daily quotas, or until the month ends for data transfer.
- **RTDB:** may be paused until the next period if storage or download limits are exceeded.
- **The game keeps working** because it's saved on the device first. Only stats, groups and sync pause, and pending writes retry afterwards.

**Monitoring:**
- The Firebase console's Usage tabs (Firestore and Realtime Database).
- The new Dev page shows a usage meter estimated from our own counters (finished games x cost per game).
- Optionally, the Dev page can read Google Cloud Monitoring's real counters with the admin's Google sign-in (free, read-only).
- Budget alerts need Blaze, so they aren't available.

---

## 6. Dev page (private admin)

**A separate `dev.html`.** Players never download it, so it doesn't add to their page weight. The old Dev row, password hash and gift key are removed from `index.html`.

- **Access:** sign in with Google. Every admin read and write is checked by database rules against `/admins/{uid}`, which you add by hand in the console. Nobody can make themselves an admin from the app. Opening `dev.html` without that grant shows nothing useful.
- **Token management:**
  - Search players by name, Google email or **Player ID**.
  - See their balance (earned + granted − spent).
  - Grant coins with a reason. The grant is written to `/p/{uid}/g/{id}`, which only admins can write.
  - The player's game picks it up from its once-a-day profile read.
  - Players without a profile get a **one-time gift link** instead: an unguessable ID in `/gifts`, claimable once and recorded.
  - Every admin action is appended to `/log` (admin-only, can't be edited or deleted).
- **Analytics:** Google Analytics 4 (free).
  - `index.html` sends page views plus custom events: `game_start`, `game_complete`, `share`, `challenge_open`, `group_join`, `group_create`. **No Firestore writes for analytics.**
  - `dev.html` reads GA4 through its Data API using the admin's own Google sign-in (free, read-only). GA's own permissions control who can see the data, so no keys are stored anywhere.
  - Shows: total, new and returning visitors; daily, weekly and monthly active users; started, finished, shared, challenge arrivals and group joins; over 7, 30 or 90 days.
  - Exact finished-game counts and players' average come from our own stats nodes.
  - **Limits:** ad blockers hide about 15-30% of visitors from GA, and GA's standard reports run about a day behind.
- **What you set up once:**
  1. a GA4 property;
  2. an OAuth client ID for `www.roughly.gg` (both free, in the Google console);
  3. enable the Analytics Data API;
  4. add your user ID under `/admins`.

  Step-by-step instructions will go in `backend/FIREBASE-SETUP.md`.
- **Security summary:**
  - No secrets in the page; all admin power comes from database rules.
  - Grants are only writable by admins.
  - Gift links are random IDs created by admins and claimable once.
  - Old signature-based gift links stop working (decision 5).

---

## 7. Groups

### A. The group creator can remove members

- The owner sees **Remove** next to each other member on the board, with a confirmation: "Remove Sam from Doha Crew? Their past scores stay in the group's history."
- Firestore rules only let the owner remove someone else, and add them to `removed`.
- A removed member can't read the group, add scores or rejoin with the old link. The rules check `removed`.
- Their past weekly totals stay in the weekly docs.
- The rejoin-after-ID-change logic skips groups that refuse access.

### B. The invite opens on a loading screen instead of the game

**Root cause, from the code:**

1. The invite sheet only appears after all three Firebase scripts download, anonymous sign-in finishes, and the group is read. On a slow connection that's several seconds, and by then the player is already looking at question 1. The sheet then drops over the game.
2. Tapping Join reads the group a second time, then writes the member record, then today's score. Then it opens the **group board**, which runs three more queries behind a "Loading…" sheet with a 7-second timeout. That's the loading page. The game is underneath it, and the player has to close the board to reach it.
3. The `?g=` code is removed from the address bar before joining, so **refreshing mid-join loses the invite.**
4. An invalid link fails silently. A player who's already a member also lands on the loading board.

**Fix:**
- Show the invite sheet **immediately** from the link, before Firebase loads, with the name field ready. The group name fills in when it arrives.
- On Join:
  1. one write: `arrayUnion` on the member list, with the name in the group doc;
  2. **close the sheet and go straight to the game** (or Home, if today is already finished), with a one-line "You joined Doha Crew" note;
  3. the board loads in the background into the cache.
- Keep the pending invite in `sessionStorage` until it succeeds or is dismissed, so a refresh resumes it.
- Joining is safe to repeat:
  - adding to the member list is naturally idempotent;
  - today's group score uses the per-member `last day` guard;
  - `removed` members are refused.
- Invalid, removed or full groups get a short friendly message and a Play button.

---

## 8. Files affected, and testing

**Files:**

| File | Changes |
|---|---|
| `index.html` | Firebase module (RTDB REST layer, profile sync, linking and merge, cache), stats fetch, groups UI (remove member, invite flow), menu sign-in sheet, streak logic, GA4 events. Removes the Dev hash and gift key. |
| `dev.html` | New |
| `backend/firestore.rules` | Groups: week docs, `removed`, aliases; `answers` closed to new writes |
| `backend/database.rules.json` | New: RTDB rules |
| `backend/FIREBASE-SETUP.md` | Console steps |
| `CLAUDE.md` | Updated |
| `qa-report/tests/*` | New test suites |

The node backend (`backend/server.js`) is left untouched but unused.

**Testing:**

1. **Firebase Emulator Suite** (Auth, Firestore, RTDB) running locally. Java is available here. This needs `firebase-tools` and `@firebase/rules-unit-testing` as **test-only** tools; they're never shipped to players (decision 7). Rule tests cover:
   - every allowed and denied write;
   - double counting, other people's bins, backdated days;
   - non-admin grants, forged gifts;
   - kicked members writing;
   - alias abuse.
2. **Playwright against the emulators**, using the real Firebase SDK rather than fakes:
   - full games on mobile and desktop, checked against today's screenshots for identical UI;
   - every case from the streak audit;
   - midnight with a controlled clock;
   - linking (new Google account, existing Google account with and without progress, sign-out);
   - second device;
   - offline and refresh during submission;
   - 50 parallel submissions for the same player (exactly one counted);
   - invite flow on a throttled "slow 3G" connection, refresh mid-join, invalid link;
   - owner removing a member.
3. **Staging Firebase project (recommended, free).** A copy of the setup for a real-quota and connection test (a few hundred simultaneous submissions) before production.
4. **Migration checks:** existing device data loads with the same streak, coins and history; existing groups still open.

**Order of work** (each step separately reviewable; none deployed without your go-ahead):
1. stats and RTDB layer;
2. streak fixes;
3. sign-in and merge;
4. groups (remove member, invite flow, weekly docs);
5. Dev page and GA4.

---

## 9. Decisions needed from you

1. **Architecture:** recommended (RTDB for high-volume data plus Firestore groups, ~11.7k–16.7k finished games a day), or Option A (Firestore only, ~5.5k–7.9k a day, one database)?
2. **Qatar time for everyone:** players abroad would get the new drop at Doha midnight, and the countdown would follow it. OK?
3. **Sign out:** should it clear this device's progress copy (recommended, safe because it's in the Google account) or keep it?
4. **GA4 and cookies:** a small consent banner (most accurate; a visible change) or GA's cookieless mode (no banner; returning-visitor numbers become estimates)?
5. **Old gift links and the Dev code stop working** once the secret leaves the page. OK?
6. **Small visible additions:**
   - a "Continue with Google" sheet behind the menu Sign in row;
   - a Player ID line in the menu (so you can find someone to gift);
   - the "You joined Doha Crew" note;
   - the owner's Remove button with its confirmation;
   - the invalid-invite message;
   - the "open in your browser to sign in" message.
7. **Test-only tools:** OK to use `firebase-tools` and `@firebase/rules-unit-testing` in `qa-report/tests`? They're never shipped.
8. **Staging:** can you create a second free Firebase project for testing (a 5-minute job; I'll give exact steps)?
