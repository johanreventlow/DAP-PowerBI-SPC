# Centerline Calculation — Spec Delta

## REMOVED Requirements

### Requirement: i_m Chart Type (Median Centerline + Mean MR)

**Reason:** `i_m` er en PowerBI-SPC-innovation der ikke findes i `qicharts2`. Hybrid-variant (median centerline + mean moving range) uden tydelig brug-case når både `i` (full mean) og — historisk — `i_mm` (full median) eksisterede. F2-strategien er ren qicharts2-parity.

**Migration:** Brugere der ønsker median-centerline I-chart må bruge AUS-DOH upstream eller vente på fremtidig F4 hvis design-præference opstår igen.

### Requirement: i_mm Chart Type (Median Centerline + Median MR)

**Reason:** `i_mm` er en PowerBI-SPC-innovation der ikke findes i `qicharts2`. Bruger har eksplicit besluttet (F1-explore-cycle, 2026-05-19) at robust-I-chart-variant ikke er nødvendig for BFH's use-case. Kan tilføjes igen senere hvis behovet opstår.

**Migration:** Eksisterende rapporter med `chart_type = "i_mm"` får unknown-chart-type ved load. Acceptabelt (ingen produktionsbrug af pakken).

## MODIFIED Requirements

### Requirement: Available Chart Types

`chart_type`-dropdown MUST kun indeholde chart-typer der findes i `qicharts2`. Efter F2:

```
Valid chart_types (12):
  run, i, mr, p, pp, u, up, c, xbar, s, g, t
```

Tidligere `i_m` og `i_mm` er fjernet (REMOVED-requirements ovenfor).

**Default chart_type:** Forbliver `"i"` (uændret fra eksisterende baseline; F1-explore besluttede ej-default-skift).

#### Scenario: Ny visual starter med chart_type = "i"

- **WHEN** brugeren opretter ny Power BI-visual
- **THEN** `chart_type` initialiseres til `"i"` (mean centerline + mean MR + 3σ — matcher `qicharts2::qic.i`)

#### Scenario: Dropdown viser kun qicharts2-parity-typer

- **WHEN** brugeren åbner `chart_type`-dropdown
- **THEN** valgmulighederne er kun de 12 typer fra qicharts2. `i_m` og `i_mm` MUST IKKE være tilgængelige.

#### Scenario: Eksisterende rapport med ugyldig chart_type fejler eksplicit

- **WHEN** en eksisterende Power BI-rapport indeholder gemt `chart_type = "i_m"` eller `"i_mm"`
- **THEN** visualet fejler eksplicit ved load (eller falder tilbage til default `"i"` afhængigt af Power BI's handling) — F2 introducerer ingen migration-shim.
