# Chart Rendering — Spec Delta (add-limit-band)

## ADDED Requirements

### Requirement: Kontrolgrænsebånd (ribbon)

Når "Udfyld kontrolgrænseområde" er aktiveret SHALL chartet rendere et udfyldt område mellem nedre og øvre 3σ-kontrolgrænse med konfigurerbar farve og gennemsigtighed. Båndet SHALL tegnes per fase (brudt ved faseskift), placeres bag alle linjer og datapunkter, og udelades på charts uden kontrolgrænser. Default er båndet slået FRA.

#### Scenario: Default ingen ændring

- **WHEN** en eksisterende rapport opgraderes uden settings-ændringer
- **THEN** vises intet bånd

#### Scenario: Bånd per fase

- **WHEN** chartet har to faser og båndet er aktiveret
- **THEN** rendres to adskilte båndsegmenter, hver efter fasens egne grænser

#### Scenario: Bag øvrige elementer

- **WHEN** båndet er aktiveret
- **THEN** tegnes datalinje, kontrolgrænselinjer, centerline og punkter OVEN PÅ båndet

#### Scenario: Chart uden kontrolgrænser

- **WHEN** diagramtypen er seriediagram (run)
- **THEN** rendres intet bånd uanset toggle
