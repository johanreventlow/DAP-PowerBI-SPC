# Reviews

Audit-trail for systematiske reviews af OpenSpec-changes + større kode-ændringer.

## Cycles

| # | Dato | Område | Status | Doc |
|---|------|--------|--------|-----|
| 01 | 2026-05-19 | `add-anhoj-rules` proposal (F1) | ✅ Reconcile | [01-add-anhoj-rules-proposal.md](01-add-anhoj-rules-proposal.md) |
| 02 | 2026-05-19 | `remove-non-anhoj-rules` proposal (F2) | ✅ Reconcile | [02-remove-non-anhoj-rules-proposal.md](02-remove-non-anhoj-rules-proposal.md) |
| 03 | 2026-09-16 | `add-i-prime-chart` implementation (I′, `ip`) | ✅ Reconcile + implementeret (0a631d2, 64be788, 081b401) | [03-add-i-prime-chart.md](03-add-i-prime-chart.md) |

## Læringer (akkumulerer)

1. **Verificér tredjeparts-references EMPIRISK før encoding i proposal.** Cycle 01: claim "qicharts2's `chart='i'` bruger median" var falsk — qicharts2's `qic.i` bruger mean-centerline. Falsificeret via R-session i 30 sekunder. Lære: når en proposal påberåber sig "X matcher pakke Y", kør pakke Y først.

2. **`lineData` grupperer per linje-TYPE, ej data-GROUP.** `groupBy(formattedLines, "group")` (viewModelClass.ts:782) bruger linje-label (`"targets"`, `"ll99"`, etc.) som key. Multi-group/rebaseline-charts er flade i `groupedLines`-struktur. Nye signal-states der varierer per data-gruppe SKAL embeds i `lineData`-objektet (eller via separat segment-id), ej beregnes ved render-tid.

3. **Trigger-baseret Codex-invokation ROI:** Cycle 01: 4 confirmed findings + 1 nye missed bug for én ~5min Codex-pass. Empiriske claims om tredjeparts-bibliotek + cross-component contracts er Codex' styrkeområder.

4. **Tooltip-laget er separat consumer-overflade** (Cycle 02 Codex N1). Når downstream-consumers af viewmodel-typer kortlægges, søges typisk `Xtype.field` i `src/Classes/`. Tooltip-koden læser samme data via `table_row.field` + `inputSettings.X.field` — separate adgangsmønstre. Husk altid at grep `src/Functions/buildTooltip.ts` ved cross-cutting type-refactors.

5. **Active vs commented validation-blocks: scan hele filen, antag ej "block-grouping"** (Cycle 02 Codex N2 + recalibreret H5). Da jeg så `/* ... */` på linje 104-113 i settingsClass.ts antog jeg HELE improvement_direction-blokken var commented. Den AKTIVE blok lige over (linje 96-102) var en separat enhed. Pattern: når en del af logikken er commented-out, søg eksplicit efter andre referencer FØR konklusion.

6. **capabilities.json er en SEPARAT schema-overflade** (Cycle 02 Codex N3). settings.ts er TypeScript-driven UI-config; capabilities.json er Power BI's persisted schema. Cleanup-tasks SKAL eksplicit nævne begge. Stale capabilities.json declarerer settings der ej findes → Power BI runtime-binding fejl.

7. **Stacked-PR-discipline kræver eksplicit declaration** (Cycle 02 Codex N4). Når F2-branch ligger på F1's HEAD og main er bagud, PR-strategi MÅ besluttes før implementation. Standard-default (PR mod main) ville inkludere F1+F2 commits i én diff. Alternativer: vent på F1-merge (kost: tid), eller stacked-PR mod F1-branch (kost: extra review-koordinering).

8. **En test, der bekræfter implementationen, er ikke en test af spec'en** (Cycle 03 Codex NEW). Valideringstesten for `ip` låste "Nævner er negativ" for −1, fordi forventningen blev skrevet af koden i stedet for spec-scenariet ("Nævner skal være større end 0"). Codex fangede spec-driften; Phase 1-agenten kaldte kæden "korrekt ordnet". Pattern: skriv valideringsforventninger fra spec-scenarierne FØR implementationen læses.

9. **Flydende-tal-grænsetests skal spejle produktionens operationsorden** (Cycle 03 L4). `√(π/2)·|Δ|/√2` og `(√(π/2)/√2)·|Δ|` afviger med 1 ulp; en `toBe`-lighed på screening-grænsen falder, selvom matematikken er identisk. Og: ulp-forskydning kan ikke skelne `<` fra `<=` — kun en konstrueret eksakt lighed kan, og den skal verificeres med `toBe` før den bruges som mutation-fælde.
