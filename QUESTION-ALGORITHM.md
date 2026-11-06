# Roughly — how to invent a question and estimate its answer

A repeatable recipe for writing new "how many…?" questions and setting a number that is **believable but debatable** — the sweet spot where two smart friends guess 2–5× apart, nobody can look up the exact answer in five seconds, and the reveal makes people nod. The log-scoring already rewards "right scale", so a good question lives in the argument zone, not the trivia zone.

There are two kinds of question:
- **Estimate** (the default, tags `R` or `D`): no exact public answer. The whole point is reasoning to a believable guess.
- **Fact** (category `Facts`, tag `O`, with an `asof` year): one real, published answer. Use this only when the number is genuinely lookup-able and stable-ish, and stamp it with `asof` so it can't silently go stale.

---

## The 7 steps (for an Estimate question)

**1. Pick a countable noun + a scope.**
Template: *"How many **[unit]** [verb] in Qatar [per **timeframe**]?"*
- Unit must be concrete and picturable (bottles, tyres, cups, honks — not "activity" or "usage").
- Timeframe: per day · per year · right now · on a [Friday / Ramadan night / cool evening].
- Good topics: everyday consumption, infrastructure counts, behaviour, scale/geography comparisons.

**2. Anchor, don't guess.** Build the number by chaining a **verified base rate** with 1–2 plausible per-unit rates. Keep it to **2–3 steps** (one phone screen).

Verified anchors (as of 2026 — update yearly):

| Anchor | Value | Source confidence |
|---|---|---|
| Residents | ~3.2 million | Official (NPC) |
| Households | ~750,000 (≈4 people each) | Derived |
| Cars on the road | ~1.8 million | Derived |
| Land area | 11,586 km² | Official |
| Coastline | ~560 km; widest ~85 km | Official |
| Water use | ~450 L per person per day | Official |
| Electricity | ~56 TWh/yr (~154M kWh/day) | Official |
| Airport passengers | ~54M/yr (~149k/day) | Official |
| Rainfall / sunshine | ~75 mm/yr · ~3,430 h/yr | Official |

`estimate m = anchor × rate₁ × rate₂ …`

**3. Choose rates that are defensible AND arguable.** This is where the controversy lives. A rate like *"1 in 3 buys a coffee on a given day"* is believable, but a reasonable person could say 1 in 2 or 1 in 5. Pick rates people would argue over by **±2–3×**. Avoid rates you can't defend in one sentence, and avoid ones so obvious there's nothing to discuss.

**4. Set the plausible range `[lo, hi]` to bracket the disagreement.**
- Default: `lo ≈ m ÷ 3`, `hi ≈ m × 3`.
- Fuzzier topic (behaviour, one-off occasions): `lo ≈ m ÷ 5`, `hi ≈ m × 5`.
- The band is the "reasonable people disagree" zone; it drives the reveal chart, not the score.

**5. Tag the source honestly (`k`).**
- `O` Official — the final number is a published figure (rare; usually a Fact).
- `D` Derived — built from published figures + simple arithmetic (e.g. airport pax ÷ 365).
- `R` Rough estimate — rests on assumed rates (the default; omit `k`, it defaults to R).

**6. Write the fun fact (`f`) and the hint (`HINTS[i]`).**
- `f`: one memorable, true-ish line. No number that gives the answer away.
- Hint: nudge toward an anchor ("Qatar has about 1.8 million cars"), never state the answer.

**7. Run the controversy test.** Keep the question only if **all three** hold:
1. Nobody can Google the exact answer in 5 seconds. (If they can → make it a **Fact** instead.)
2. Two smart friends would guess numbers **2–5× apart**.
3. The reveal's reasoning makes people go "huh, fair" — not "that's obviously made up."
Reject if the range is so wide the number is meaningless, or so tight there's nothing to argue about.

---

## Scoring, so you can feel the ranges

`score = max(1, round(100 / (1 + d²/0.36)))`, where `d = log10(your ratio off)`.

| Off by | Score |
|---|---|
| spot on | 100 |
| 2× | ~80 |
| 3× | ~55 |
| 5× | ~38 |
| 10× | ~26 |

So landing in the 2–3× "debate zone" still scores well — which is exactly why the estimate only needs to be believable, not provable.

---

## The question object (what to write in `index.html`)

Append to the **end** of `Q` only (never reorder — stats/saved games/sync match by index), and append a parallel entry to `HINTS` at the same index.

```js
{
  c:"Food & drink",                 // category (existing one, or a new one + an ICONS entry)
  k:"D",                            // O | D | R  (omit for R)
  asof:"2026",                     // Facts only — stamps the answer's date
  t:"How many … in Qatar …?",       // question
  u:"balls",                        // unit shown with the number
  m:3e6, lo:1e6, hi:8e6,            // estimate, and the plausible band (m÷3 .. m×3)
  s:["About 3 million residents",   // 2–3 reasoning steps, last one starts with ≈ or "Total"
     "× roughly 1 each a day",
     "≈ 3 million"],
  f:"A memorable, true-ish line.",   // fun fact
  ar:{ t:"…", u:"…", s:["…","…"], f:"…" }   // Arabic (MSA) — required for new questions
}
// and at the same index in HINTS:
["Good to know", "English nudge toward an anchor", "عربي"]
```

Numbers in `m/lo/hi` are in base units; `s`/`f` keep Western digits — the app renders them as Arabic-Indic in Arabic mode automatically. Facts also flip the reveal label to "Answer" and show "As of <year>".

---

## A worked example

**Idea:** "How many falafel balls does Qatar fry in a day?"
1. Unit = falafel balls, scope = per day.
2. Anchor = 3.2M residents.
3. Rate = "~1 ball per person per day" — defensible (many eat 5 in a wrap, many eat none), and arguable (could be 0.5 or 2).
4. `m = 3,000,000`; band `lo 1M … hi 8M`.
5. Tag `R` (rests on an assumed rate).
6. `f` = "They almost always arrive five at a time, in a sandwich."
7. Controversy test: not Googleable ✓, friends would say 1M vs 6M ✓, reasoning is fair ✓. **Keep.**

## When to make it a Fact instead

If the honest answer is a single published, stable number — Metro stations (37), municipalities (8), World Cup stadiums (8) — it fails controversy test #1. Put it in the **Facts** category with `k:"O"` and `asof`, so it reads as "this one has a real answer" and carries its date.
