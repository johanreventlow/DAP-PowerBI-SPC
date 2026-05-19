# Chart Rendering — Spec Delta

## REMOVED Requirements

### Requirement: NHS Variation Icons

**Reason:** NHS Making Data Count-ikoner (improvementHigh, improvementLow, concernHigh, concernLow, commonCause, neutralHigh, neutralLow) signalerer "process improving" / "deteriorating" / "consistent pass" / "consistent fail" baseret på improvement_direction-mapping. Direkte modsætning til Anhøj-filosofien (signal = invitation til undersøgelse, ej dom). Brugere der ønsker NHS Making Data Count-paradigmet må bruge AUS-DOH upstream-pakken.

**Migration:** Ingen. Anhøj's signal-rendering er stiplet centerline (F1) + outlier-coloring af specifikke punkter (F2 outsideControlLimits + F1 anhojLongRun).

### Requirement: NHS Assurance Icons

**Reason:** Tilsvarende NHS-paradigm (consistentPass, consistentFail, inconsistent) — ej forenelig med Anhøj-filosofien.

**Migration:** Ingen.

### Requirement: Warning Limit Lines (1σ + 2σ)

**Reason:** Warning-limits (`ll95`/`ul95` ved 2σ, `ll68`/`ul68` ved 1σ) blev primært brugt af `two_in_three`-reglen (fjernet i F2). Anhøj's signal-detektion bruger kun 3σ-grænserne. Fortsat visning ville give visuel støj uden semantisk værdi.

**Migration:** Brugere der vil se warning-limits må bruge AUS-DOH upstream. F2 fjerner `lines.show_95` og `lines.show_68` settings.

