# Roughly Qatar: question-quality report

**Scope:** all 198 questions in the live bank (193 active, 5 retired: #16, #106, #134, #139, #140). I read every question's title, estimate, range, reasoning steps, fun fact and hint, ran an automated check on the step arithmetic, and simulated the schedule 400 days ahead.
**Full per-question list with flags:** `question-audit.csv`. 45 questions are flagged: 11 High, 18 Medium, 16 Low.

## Bank at a glance

| | |
|---|---|
| Categories | Doha life 49, Food & drink 26, Everyday Qatar 20, Roads 19, Money 17, Geography 16, Travel 14, Resources 13, Sport 13, Facts 6 |
| Source tags | Rough estimate 173, Derived 13, Official 7 |
| Reasoning template | 49 questions start "About 3 million residents × …"; 14 start from "1.8 million cars" |
| Arithmetic | Automated check of every "a × b ≈ c" step: clean apart from #100 (below) |

The bank is warm, local and funny, and the reasoning steps are short and followable. That's its strength. The problems are a few wrong facts, a handful of duplicates, one systematic wording ambiguity, and a schedule that will start repeating Doha-life questions within seven weeks.

## 1. Exact and near-duplicates

| Pair | Problem | Closest scheduled gap |
|---|---|---|
| **#161 / #177** street lights | Same question, contradicting answers: 200,000 (20 lamps/km) vs 350,000 (35 lamps/km) on the same 10,000 km | 8 days (#177 dropped today) |
| **#164 / #178** coffee at Hamad Airport | Same question: 60,000 (1 in 2.5) vs 37,000 (1 in 4) | 7 days (#178 drops 15 Nov) |
| **#44 / #145 / #93** | Suitcases, boarding passes, Qatar Airways passengers: all about 140,000-150,000, all "Hamad passengers per day" | 17-29 days |
| #83 / #154 | Private-school pupils: 230,000 in one, 300,000 in the other (and #83's own hint says 300,000) | 33 days |
| #69 → #70 | Calls to prayer is just mosques × 5 | 22 days |
| #2 → #159 | Long voice notes builds on voice notes per day | 3 days |
| #54 / #126 | Selfies at The Pearl / selfies at Katara: same template | 6 days |
| #25 / #121 | Stray cats / cats fed at restaurants | 5 days |
| #9 / #39 / #176 | Fuel litres, fuel riyals, km driven: all derived from the same 63M km | 8-13 days |

Recommendation: retire one question of each of the first two pairs (add them to `SKIP`), and keep derived pairs at least a full cycle apart.

## 2. How often questions repeat

**Before 11 Nov (old random picker):** 26 of 91 questions shown in the first 41 days came back. Some returned after only **2 days** (#32, #43, #49, #154).

**From 11 Nov (rotation):** no repeats within a cycle, but the pools are small:

| Pool | Size | First repeat | Shortest gap | Typical gap |
|---|---|---|---|---|
| Doha life (1 a day) | 49 | **30 Dec 2026** | 22 days | 49 days |
| Everything else (2 a day) | 144 | later | 38 days | 72 days |

**To stay repeat-free:** about 7 new Doha-life and 14 other questions a week. Otherwise accept the cycle, but then fix H1 first, because appending questions currently reshuffles the schedule.

**Schedule integrity (QA report H1):** past days' drops have already been reshuffled twice by question batches. The drop for any day isn't fixed until the schedule is frozen.

## 3. Incorrect answers and calculations

| # | Question | Error | Fix |
|---|---|---|---|
| **176** | km driven by Qatar's cars per day (63M) | Fun fact "Earth to the Sun and back a few times". The Sun is 150M km away, so 63M km is under halfway there once. | e.g. "about 1,600 times round the Earth" |
| **46** | km of Doha Metro track (76) | Fun fact "further than the drive from Doha to the Saudi border". Doha to Abu Samra is about 90 km or more. | Drop or replace the fact |
| **39** | Riyals spent on fuel a day | Uses QAR 1.5 a litre. 2025-26 pump prices are about QAR 1.95-2.10, so the estimate should be about QAR 16M. | Update price and estimate |
| **145** | Boarding passes scanned at Hamad a day | 54M a year counts arrivals and departures. Only departures scan a boarding pass, so about 74,000, not 149,000. | Halve it, or retire as a duplicate |
| **100** | People stacked to the height of the tallest tower | 300 / 1.7 = **176**, steps say 190. | Fix the step and name the tower |
| **83** | Riyals spent on private school fees a year | Steps say 230,000 pupils; hint says 300,000. | Pick one figure |
| **148** | Solar panels in Qatar (tagged Official) | Counts only Al Kharsaah. Ignores the 2025 Mesaieed and Ras Laffan plants and rooftop panels. | Reword to "at Al Kharsaah" or re-source |

**Likely wrong, needs a source:**
- #104: 3.3 GB per person per day is about 100 GB a month. The Gulf average is about 20-40 GB a month.
- #156: assumes 12,000-15,000 weddings a year. Registered marriages are about 4,000-5,000.
- #93: Qatar Airways carries about 40-43M passengers a year, not 50M.
- #167: 60 days a year above 45°C, tagged Derived with no source. Looks high for Doha.

## 4. Ambiguous questions

**The "someone" / "a driver" problem (High).** The same phrasing is used for per-person answers and for national totals, so a careful reader can be 100,000x off and score 1%:

| Reads as… | # | Title (shortened) | Actual answer |
|---|---|---|---|
| per person, answer is per person | 115 | How many times a day does someone say 'yalla'? | 40 |
| per person, answer is per person | 53, 55, 189, 195 | someone / a Doha driver … a week | 3-12 |
| per person, **answer is national** | 122 | …does someone say 'five minutes'… | **900,000** |
| per person, **answer is national** | 117 | …does someone double-park 'for one minute'… | **300,000** |
| per person, **answer is national** | 127 | …does someone get lost inside a big Doha mall? | **15,000** |
| per person, **answer is national** | 129, 131 | …does a Doha driver reverse neatly / check the map… | **300,000 / 1M** |
| per driver, **answer is national** | 32 | …does a delivery driver call to ask "where exactly…" | **200,000** |

Fix: national totals say "across Qatar", per-person ones say "the average person". For example: "Across Qatar, how many times a day does someone double-park 'for one minute'?"

**Other ambiguities:**
- #42 traffic lights: junctions, poles or light heads?
- #101 desalinated seawater: intake or fresh-water output (2-3x different)?
- #99 islands: do The Pearl's islands and tidal sandbanks count?
- #111 people at "a big stadium match": the answer ranges from 40,000 to 88,000 depending on the stadium.
- Missing time frame:
  - #119 cars left idling: no time frame at all.
  - #25 stray cats, #41 Land Cruisers, #143 EVs: these read fine as "right now". A time frame isn't needed for stocks, only for flows.

## 5. Poorly worded or unanswerable

- **#120** "How many times does a majlis conversation solve all the world's problems in one night?" There's no reasoning path, so the score is arbitrary.
- **#125** AC remote goes missing per week, and **#57** laps of a car park: jokes rather than estimates.
- **#105** tonnes of sand blown onto roads: unverifiable, and the steps only restate the number.

Recommendation: keep a couple of these as a clearly labelled "just for fun" question with no score, or rewrite them so a reasoning path exists.

## 6. Units, rounding and tolerances

- **#191 (°C):** log scoring doesn't work for temperature. 16°C and 30°C both score 94-96. Score it on degrees of difference, or retire it.
- **Facts with small exact counts (#133, #136, #137, #138):** the log scale is too lenient (wrong by 2 out of 8 still scores 96%), and **0 can't be entered**. Consider exact / off-by-one / far scoring for Facts.
- **Kilometres wording:** 10 titles say "kilometres" while the answer box offers miles (also an open item in `CLAUDE.md`).
- **Capitalised units:** they appear mid-sentence ("Enter a number in Eggs", "Suitcases").
- **Ranges:** #188 spans 30-2,500 (x83), and its "plausible" edges score 23-35%. #191 is the narrowest (x1.47). The rest are consistent at about 3-10x wide.
- **Rounding of estimates:** sensible throughout. Displayed estimates match the steps except #100.

## 7. Too obscure, trivial or uninteresting

- **Obscure:** #153 hawksbill hatchlings per season (single niche source).
- **Trivial or guessable:**
  - #133 times Qatar hosted the Asian Games (1);
  - #111 stadium crowd;
  - #138 2022 World Cup stadiums (8): widely known, and the log scale rewards near-misses anyway.
- **Formulaic:** 49 questions are "3 million residents × a per-person rate". Fine individually, but several a week makes the reasoning predictable. Mix in questions that need a different first step (area, time, distance, capacity), like the strong #14 (everyone standing in Qatar), #47 (pitches inside the airport) and #151 (walking across Qatar).
- **Strongest content:** Doha-life observational questions with a funny but followable path, such as #23 ("two minutes away"), #193 (dinner party start), #192 (saved tradesmen). They match the brief.

## 8. Can the answers be checked?

- **173 Rough estimates:** honest by design. They're assumption chains and the UI says so.
- **Can be checked against a public source but tagged Rough estimate:**

  | # | Question | Possible source |
  |---|---|---|
  | 46 | Metro track | Doha Metro |
  | 69 | Mosques | Ministry of Awqaf |
  | 87 | Petrol stations | Woqod |
  | 93 | Qatar Airways passengers | QR annual report |
  | 94 | Hotel rooms | Qatar Tourism |
  | 186 | Births | PSA |

- **Tagged Derived or Official with no source shown:** #152 (rainfall), #153 (hatchlings), #167 (hot days). #148 is tagged Official but the logic is incomplete.

Recommendation: add an optional `src` field (publisher + year) to every Derived or Official question and show it under the tag. Re-check `asof` facts every January.
