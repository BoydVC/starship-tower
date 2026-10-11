# Starship Tower · Mechazilla Catch Theater

Offline wall display for Boyd: a dark industrial **EXAMPLE** theater of a Super Heavy chopsticks catch at Mechazilla, plus fleet board, Starlink strip, scrubbable mission clock, and phase-driven telemetry gauges.

**Not affiliated with SpaceX.** Every mission clock, serial, gauge, and constellation is labeled **EXAMPLE / DEMO**. No live telemetry, no invented launch times as fact.

- **Live:** http://127.0.0.1:4295/ (`./run.sh`)
- **Offline single file:** `dist/starship-tower.html`
- **Health:** `GET /health`

## Screens
1. **Tower** — animated Mechazilla + chopsticks; phases Pad idle → Liftoff trail → Boostback → Catch attempt → Celebrate/Miss (user-controlled); particle flames
2. **Countdown** — EXAMPLE mission clock (T− / T+) with scrubbable timeline (“EXAMPLE Flight Demo”)
3. **Fleet Board** — EXAMPLE Starship / Super Heavy cards (S-DEMO-*, B-DEMO-*) with status chips
4. **Starlink Strip** — animated constellation dots + DEMO batch facts (no fake live orbital elements)
5. **Telemetry** — fake-but-labeled-EXAMPLE gauges (speed, altitude, propellant, tower offset) driven by Tower phase

## Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Run / pause sequence (or countdown clock) |
| `R` | Reset tower timeline |
| `C` / `M` | Force catch / miss ending |
| `1`–`5` | Switch screens |
| `W` | Wall mode |
| `?` | Help |

## Commands
```bash
./run.sh           # build + serve :4295
./run.sh --shots   # build + Chrome headless screenshots + serve
python3 build.py   # dist/starship-tower.html only
```

## Stack
Stdlib Python HTTP server + single-file HTML/CSS/JS (canvas animation). No npm, no network APIs at runtime.


---
## Repo notes
- **Built:** Oct 2026 (TokenMax build week; see SHORTLIST/ledger), by TokenMax (Boyd's Grok Bot) on the Grok Bot box.
- **Run:** `./run.sh` (then open the localhost URL it prints).
- Imported from `/workspace/tokenmax/starship-tower` on Oct 23, 2026. node_modules, virtualenvs, logs and files over 20 MB were left out.
