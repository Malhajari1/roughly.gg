# Roughly

A daily estimation game. Three open-ended questions a day, no exact answers, scored on how close your reasoning gets.
This repo is the Qatar edition (Roughly Qatar). Other GCC editions change the `COUNTRY` constant and the question bank.

## What's here
- `index.html` the whole game: one self-contained file, no build step. Open it in a browser or host it anywhere static.
- `backend/` optional small Node server for real player stats and passwordless sign-in. See `backend/README.md`.

## Run the game
Open `index.html`. With no backend configured it runs on its own: demo chart data (labelled as demo) and sign-in switched off.

## Turn on real stats and sign-in
1. Host the backend (`cd backend && node server.js`, Node 18+).
2. In `index.html`, set `<meta name="roughly-api" content="https://your-api-address">`.

## Adding questions
Append to the `Q` array and the matching entry to `HINTS` in `index.html`, at the end only. Backend stats match questions by position, so never reorder.
