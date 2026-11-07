# Switching on Groups (Firebase)

Groups, invite links and the weekly friend leaderboard run on **Firebase** (Firestore + Auth), called straight from `index.html`. The game stays on GitHub Pages — Firebase is just a backend it talks to. Until you paste a real config, Groups show "not switched on yet" and nothing else changes.

You do steps 1–8 once (~10 min). No billing — the free **Spark** plan is plenty.

---

## 1. Create the project
1. Go to <https://console.firebase.google.com> → **Add project**.
2. Name it (e.g. `roughly-qatar`). Google Analytics is optional — you can skip it.

## 2. Turn on sign-in methods
1. Left menu → **Build → Authentication → Get started**.
2. **Sign-in method** tab → enable **Anonymous** (this is how everyone joins instantly).
3. Also enable **Google** (this is the "sign in to save your spot" upgrade). Pick a support email when asked.

## 3. Create the database
1. **Build → Firestore Database → Create database**.
2. Choose **Production mode** (we ship locked-down rules below).
3. Pick a location close to Qatar, e.g. `eur3 (europe-west)`. (This can't be changed later.)

## 4. Publish the security rules
1. Firestore → **Rules** tab.
2. Delete what's there and paste the entire contents of **`backend/firestore.rules`** from this repo.
3. **Publish**. These rules let a player read/write only their own group membership and their own scores (1–100), and block tampering with anyone else's.

## 5. Authorize your domains
1. **Authentication → Settings → Authorized domains → Add domain**.
2. Add each of: `roughly.gg`, `www.roughly.gg`, `malhajari1.github.io`, `localhost`.
   (These are the places the Google sign-in popup is allowed to run. `localhost` + `github.io` are enough to test.)

## 6. Get your web config
1. **Project settings** (gear icon, top-left) → **General** → scroll to **Your apps** → click the **Web** icon `</>`.
2. Register the app (nickname `roughly-web`, no Hosting needed).
3. Copy the `firebaseConfig` object it shows — it looks like:
   ```js
   const firebaseConfig = {
     apiKey: "AIza…",
     authDomain: "roughly-qatar.firebaseapp.com",
     projectId: "roughly-qatar",
     appId: "1:…:web:…"
   };
   ```
   > The `apiKey` here is **public and safe to commit** — it only identifies the project. Real security is the rules from step 4, not this key.

## 7. Paste it into the game
1. Open `index.html`, find the block near the bottom that starts with:
   ```js
   /* ===== Roughly Groups backend (Firebase) … */
   const firebaseConfig = { apiKey: "", … };
   ```
2. Replace that object with the one you copied. (`authDomain`, `projectId`, `appId` and `apiKey` are the ones that matter.)
3. Save.

## 8. Ship it
1. Commit and push `index.html`. GitHub Pages redeploys in a few minutes.
2. Open the site → menu → **Groups**. You should now see **Create a group** / **Join with a code** instead of "not switched on yet".

---

## Testing it works
- **One group, two people:** create a group on your phone, tap **Invite friends → Copy link**, open that link in a second phone (or a private browser window = a second anonymous player). It should show **Join "<name>"** → join → both of you play today's three → the leaderboard lists both, newest scores summed, "you" highlighted.
- **Save your spot:** on the group screen tap **Sign in with Google**. You stay the same player (same rank/score) — it just attaches your Google account so you keep the group on a new phone.
- **Weekly reset:** totals are the sum of each day's score Monday–Sunday (UTC) and start fresh each Monday.

## Notes & limits
- **HTTPS:** Google sign-in's popup needs the page on **https**. `localhost` and `malhajari1.github.io` are fine. Finish enabling HTTPS on `roughly.gg` (GitHub → Settings → Pages → Enforce HTTPS) before relying on Google sign-in there; anonymous play + joining work on http regardless.
- **Free tier:** Spark gives 50k reads / 20k writes a day and 1 GiB stored — far above what a friends game needs. If you ever outgrow it, upgrade to Blaze (pay-as-you-go) in the console; no code change.
- **Your data:** everything (groups, names, scores) lives in **your** Firestore. Firestore → Data tab lets you browse, export or delete it. You can export a user's data or delete an account from the Authentication tab.
- **What's deliberately left for later:** scores are still client-reported (same as the rest of the game), so a determined cheat could inflate their own number; server-side scoring (Cloud Functions) is a future hardening step. No group chat, no notifications yet.
