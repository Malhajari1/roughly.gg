# Roughly: Firebase steps to go live

Hi! This is everything needed in the Firebase / Google Cloud console for the next Roughly release. Project: **roughly-16260**.

- **Time:** about 30 minutes, plus 15 more if you also set up Google Analytics (step 7).
- **Safe to do now:** steps 1–4 don't break the current live site. The new rules also work with today's version of the game.
- **Order matters:** please do steps 1–4 first. The new site is only published after that.

**What to send back to SWISS when you're done:**
1. The Realtime Database URL (step 3).
2. Optional, from step 7: the GA4 Measurement ID (`G-…`), the GA4 property ID (numbers only) and the OAuth client ID.

---

## Step 1: Firestore security rules (5 min)

1. Firebase console → **Firestore Database** → **Rules** tab.
2. Delete everything there and paste the full contents of `backend/firestore.rules` from the repo:
   https://github.com/Malhajari1/roughly.gg/blob/claude/groups-bugs-index-icmgd9/backend/firestore.rules
   Use the "Raw" button to copy it cleanly.
3. Click **Publish**. If it shows a syntax error, stop and send SWISS a screenshot.
4. Quick check: click **Rules Playground** (on the same tab) and try these. Use **Authenticated**, and give the UID shown.

| Simulation type | Location | Authenticated as | Expected |
|---|---|---|---|
| get | `admins/abc` | UID `abc` | Allowed |
| create | `admins/abc` | UID `abc` | **Denied** |
| create | `gifts/test1` (any data) | UID `abc` | **Denied** (only admins can make gifts) |
| get | `players/abc` | UID `xyz` | **Denied** (players can't read each other) |

What these rules do, in one line: players can only touch their own data, only the group creator can remove members, and only accounts listed in `admins` can grant coins, make gift links or read the activity log.

## Step 2: Sign-in providers (5 min)

1. Firebase console → **Authentication** → **Sign-in method** tab.
2. **Anonymous** should already be **Enabled**. Leave it on; every player starts anonymous.
3. **Google**: click it → **Enable** → choose a **support email** → **Save**.
4. **Authentication** → **Settings** tab → **Authorized domains**. Make sure both are listed, and add them if not:
   - `roughly.gg`
   - `www.roughly.gg`
5. **Important:** if you see a banner offering to **"Upgrade to Firebase Authentication with Identity Platform"**, do **not** accept it. On the free plan it adds a limit of 3,000 daily users.

## Step 3: Realtime Database for the player stats (5 min)

This is a second, small database just for the daily stats graphs. On the free plan it has no limit on the number of reads and writes, which is what keeps Roughly free as it grows. It holds only anonymous numbers: no names or emails.

1. Firebase console → **Build** → **Realtime Database** → **Create Database**.
2. Location: **Belgium (europe-west1)**. It can't be in Qatar; Belgium is the closest option.
3. Security rules: choose **Start in locked mode** → **Enable**.
4. Open the **Rules** tab. Delete everything and paste the full contents of `backend/database.rules.json`:
   https://github.com/Malhajari1/roughly.gg/blob/claude/groups-bugs-index-icmgd9/backend/database.rules.json
   Then **Publish**.
5. Go to the **Data** tab and copy the URL at the top. It looks like:
   `https://roughly-16260-default-rtdb.europe-west1.firebasedatabase.app`
   **Send this URL to SWISS.**
6. Quick check in the **Rules Playground** (Rules tab):

| Type | Location | Authenticated | Data | Expected |
|---|---|---|---|---|
| Read | `/s/20800` | No | | Allowed |
| Read | `/p/abc` | Yes, UID `xyz` | | **Denied** |
| Write (set) | `/s/20800/n` | Yes, UID `abc` | `5` | **Denied** |
| Write (set) | `/p/abc/h/20800` | Yes, UID `abc` | `{"a":50,"sb":"b10","q":{"5":{"b":"b120","s":50,"x":"e"}}}` | Allowed |

## Step 4: Optional storage saver (2 min)

This keeps Firestore storage small as more players sign in.

1. Firestore Database → **Indexes** → **Single field** tab → **Add exemption**.
2. Collection ID `players`, Field path `days`. Untick all index types (Ascending, Descending, Arrays) → Save.
3. Repeat for field paths `coins` and `carry`.

## Step 5: Tell SWISS steps 1–4 are done

SWISS (with Claude) then publishes the new site. Please send the **Realtime Database URL** from step 3 at the same time.

## Step 6: Make SWISS an admin (after the new site is live, 2 min)

The admin tools (find players, give coins, gift links, activity log, analytics) only open for accounts listed in `admins`. Nobody can add themselves from the app.

1. **SWISS:** open https://www.roughly.gg, then Menu → **Sign in** → **Continue with Google**.
2. **SWISS:** Menu → next to "Player ID" tap **Copy**, and send that ID to the partner. It's about 28 characters.
3. **Partner:** Firestore Database → **Data** → **Start collection**. Collection ID `admins`; **Document ID = the ID SWISS sent**. Add one field: `name` (string) = `SWISS` → **Save**.
4. **SWISS:** reopen the menu. A **Dev** row now appears and opens the admin page.
5. To add yourself as an admin too, repeat with your own Google account.

## Step 7: Google Analytics (optional, about 15 min)

This lets the Dev page show visitors, new and returning visitors, daily, weekly and monthly active users, and how many people start, finish and share a game, open challenge links, and join groups. It's all free, and no cookie banner is needed.

**A. Create the GA4 property**
1. Go to https://analytics.google.com → Admin → **Create** → **Property** → name it "Roughly", time zone Qatar.
2. Data stream → **Web** → URL `https://www.roughly.gg` → Create.
3. Copy the **Measurement ID** (`G-XXXXXXX`). → **send to SWISS**.
4. Admin → **Property details**: copy the **Property ID** (numbers only). → **send to SWISS**.
5. Admin → **Property access management**: add SWISS's Google account (and yours) as **Viewer** or higher.

**B. Let the Dev page read the numbers.** This is Google Cloud console, the same project as Firebase.
1. https://console.cloud.google.com → choose project **roughly-16260**.
2. **APIs & Services** → **Library** → search **"Google Analytics Data API"** → **Enable**.
3. **APIs & Services** → **OAuth consent screen**:
   - User type **External**;
   - App name "Roughly Dev", with your support email;
   - Scopes: add `.../auth/analytics.readonly`;
   - **Test users:** add SWISS's Google account and yours.

   Leave it in "Testing"; no Google verification is needed for a few named admins.
4. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID** → Application type **Web application**, name "Roughly Dev":
   - **Authorised JavaScript origins:** `https://www.roughly.gg`
   - Create, then copy the **Client ID** (ends in `.apps.googleusercontent.com`). → **send to SWISS**.

   No client *secret* is needed, and none should ever be shared.

## Step 8: Keeping an eye on the free limits

- Firebase console → **Usage and billing**, then the **Usage** tabs in **Firestore Database** and **Realtime Database**.
- Free limits per day: Firestore 50,000 reads and 20,000 writes. Realtime Database: 10 GB download a month, 1 GB stored.
- If a limit is hit, nothing is charged on the free plan. The affected part (stats graphs, groups, sign-in sync) pauses until the daily reset, about 11:00 Doha time; the game itself keeps working.
- The Dev page → Analytics shows an estimate of daily Firestore writes from games.

## If something goes wrong

- **Rules:** both rules tabs keep a history. Open **Rules** → the history (clock) icon → restore the previous version.
- **Site:** SWISS can ask Claude to roll the site back to the previous version in minutes.
- Send SWISS a screenshot of any error message. The exact text helps.
