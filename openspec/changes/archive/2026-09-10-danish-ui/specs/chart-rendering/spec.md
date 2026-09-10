# Chart Rendering — Spec Delta (danish-ui)

## ADDED Requirements

### Requirement: Dansk bruger-vendt tekst

Al bruger-vendt tekst SHALL være på dansk med terminologi fra dansk SPC-praksis (Anhøj/qicharts2): formatting-panelets kort, grupper og option-labels (inkl. dropdown-display-labels), felt-brøndenes dataRole-navne, tooltip-tekster, summary-table-kolonneoverskrifter og fejlbeskeder på canvas. Interne identifikatorer (property-navne, dropdown-values, chart-type-koder) SHALL forblive uændrede, så eksisterende rapporters gemte settings fortsat virker.

#### Scenario: Formatting-panel på dansk

- **WHEN** formatting-panelet åbnes
- **THEN** vises kort, grupper og options med danske labels (fx "Anhøj-regler", "Stiplet centerlinje ved usædvanligt lang serie")

#### Scenario: Gemte settings overlever

- **WHEN** en eksisterende rapport med gemte settings åbnes efter opgradering
- **THEN** anvendes alle gemte værdier uændret (kun visningstekst er ændret)

#### Scenario: Fejlbesked på dansk

- **WHEN** input-data mangler tæller
- **THEN** vises dansk fejlbesked på canvas
