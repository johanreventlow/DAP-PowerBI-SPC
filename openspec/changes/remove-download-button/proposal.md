# Proposal: remove-download-button

## Why

Download-knappen (CSV-eksport på canvas) skal helt ud af visualen — ønske fra Johan (2026-06-11). Reducerer settings-fladen og fjerner en eksportvej der ikke ønskes i klinisk kontekst.

## What Changes

- **BREAKING** Download-kortet ("Download") + knappen fjernes: `downloadSettings.ts`, `drawDownloadButton.ts`, settings-model-entry, capabilities-objekt, visual.ts-call.

## Capabilities

### New Capabilities

(ingen)

### Modified Capabilities

- `chart-rendering`: ingen download-knap. Delta: `specs/chart-rendering/spec.md`.

## Impact

5 filer + capabilities. Gemte settings ignoreres af Power BI.
