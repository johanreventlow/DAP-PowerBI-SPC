# OpenSpec — status

Oversigt over projektets change-forslag pr. 2026-09-10.

## Udført og på main

| Change | Landede via |
|---|---|
| `changes/archive/2026-06-11-add-anhoj-rules/` | F1 — de to runs-regler og stiplet centerlinje |
| `changes/archive/2026-06-11-remove-non-anhoj-rules/` | PR #4 (`faafe95`) — `trend`, `twoInThree`, `shift`, NHS-ikoner |
| `changes/archive/2026-09-10-add-anhoj-stats-display/` | PR #3 — men som **signalpanelet**, en anden implementation end branchens `drawAnhojStats.ts` |
| `changes/archive/2026-09-10-complete-qicharts2-alignment/` | PR #8–#12 — de fem trin nedenfor |

## complete-qicharts2-alignment

Beslutningerne fra 11. juni lå på `feat/anhoj-rules-f1`, som aldrig blev
merget. Planen samlede dem i fem trin og løste samtidig tre steder, hvor
beslutninger fra samme dag modsagde hinanden — tidsstemplet afgjorde, og de
senere gjaldt.

Alle fem trin er på main. De fire changes, planen absorberede, er arkiveret
sammen med den:

| Trin | Change | PR |
|---|---|---|
| 1 | `archive/2026-09-10-remove-download-button/` + specifikationsgrænser, trendlinje, skjul `i_m`/`i_mm` | #8 |
| 2 | `archive/2026-09-10-remove-95-limits/` (og 68%) | #9 |
| 3 | retningsfarver → én `ast_colour` | #10 |
| 4 | `archive/2026-09-10-add-limit-band/` | #11 |
| 5 | `archive/2026-09-10-danish-ui/` + decimalkomma | #12 |

Spec-delta'erne er foldet ind i `specs/chart-rendering/` og
`specs/outlier-detection/`.

**Står tilbage:** ordvalget i den danske oversættelse er ikke fagligt
gennemlæst, og visualen er endnu ikke set i en rigtig Power BI-rude. Begge er
noteret som manuelle trin i planens `tasks.md`.

## Ikke afgjort

| Change | Note |
|---|---|
| `changes/remove-non-anhoj-rules/` (maj-versionen) | Overhalet af juni-revisionen i `archive/`. Dens `specs/centerline-calculation/spec.md` argumenterede for at **fjerne** chart-typerne `i_m` og `i_mm`; trin 1 valgte i stedet at **skjule** dem, så beregningerne bevares og gemte rapporter renderer som før |

## Arkiverede branches

Beslutningsgrundlaget her stammer fra `feat/anhoj-rules-f1` og
`refactor/remove-non-anhoj-f2`. Implementationerne derfra er genskrevet mod
den nuværende kodebase og merget, så branchene havde ikke længere kode, der
kun fandtes dér.

Begge er tagget og derefter slettet — lokalt og på origin (10. sep. 2026):

| Tag | Spids | Dato |
|---|---|---|
| `arkiv/f1-2026-06-17` | `7b4a98d` | 17. juni 2026 |
| `arkiv/f2-plan-2026-05-19` | `4b410e0` | 19. maj 2026 |

Tagget holder commits i live, så koden hentes stadig frem med fx
`git show arkiv/f1-2026-06-17:"src/D3 Plotting Functions/drawLimitBand.ts"`.

Tags under `arkiv/` udløser ikke release-workflowet, som kun reagerer på `v*`.
