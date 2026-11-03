# Roughly backend

Tiny server that powers three things: real "better than X% of players" charts, "63% guessed too high" lines, and the optional sign-in.
No dependencies, Node 18 or newer.

## Run it
    node server.js

Settings (environment variables):
- `PORT` (default 8787)
- `DATA_DIR` (default ./data, holds db.json, back it up)
- `ORIGIN` the website address allowed to call it, for example https://roughly.gg (default * for testing)
- `RESEND_API_KEY` and `MAIL_FROM` to email sign-in codes through resend.com
- `DEV=1` shows the sign-in code on screen instead of emailing it. Testing only.

## Connect the game
In `roughly-qatar.html`, set the address in the tag near the top:
    <meta name="roughly-api" content="https://api.yourdomain.com">
Leave it empty and the game runs on its own with demo chart data and sign-in switched off.

## Good to know
- Comparison charts only appear once 30 players have answered a question. Before that players see a short "unlocks soon" note.
- Each anonymous player id counts once per question, so replaying the same day on one device overwrites rather than inflates.
- Questions are matched by their position in the question list. Add new questions at the end only, never reorder.
- Nothing stops someone clearing their data and answering twice. Fine for launch, worth hardening if scores become competitive.
