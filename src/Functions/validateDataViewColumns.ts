import type powerbi from "powerbi-visuals-api";
import settingsClass from "../Classes/settingsClass";
import isNullOrUndefined from "./isNullOrUndefined";
import chartTypeLabel from "./chartTypeLabel";

export default function validateDataViewColumns(inputDV: powerbi.DataView[], inputSettingsClass: settingsClass): string {
  // Show blank error messages for empty data or categories as settings are
  // bound to the input categories, and so cannot disable error messages
  if (isNullOrUndefined(inputDV?.[0]) || (inputDV?.[0]?.categorical?.categories?.[0]?.identity?.length === 0)) {
    return ""; //"No data present!";
  }
  if (isNullOrUndefined(inputDV[0]?.categorical?.categories) || isNullOrUndefined(inputDV[0]?.categorical?.categories.some(d => d.source?.roles?.key))) {
    return ""; //"No grouping/ID variable passed!";
  }

  const numeratorsPresent: boolean
    = inputDV[0].categorical
                   ?.values
                   ?.some(d => d.source?.roles?.numerators) ?? false;

  if (!numeratorsPresent) {
    // Feltets navn, som brugeren ser det i Byg-ruden.
    return "Tilføj et felt til Værdi/Tæller.";
  }

  let needs_denominator: boolean = false;
  let needs_sd: boolean = false;
  let chart_type: string = inputSettingsClass.settings[0].spc.chart_type;

  if (inputSettingsClass?.derivedSettings.length > 0) {
    inputSettingsClass?.derivedSettings.forEach((d) => {
      if (d.chart_type_props.needs_denominator) {
        chart_type = d.chart_type_props.name;
        needs_denominator = true;
      }
      if (d.chart_type_props.needs_sd) {
        chart_type = d.chart_type_props.name;
        needs_sd = true;
      }
    });
  } else {
    chart_type = inputSettingsClass.settings[0].spc.chart_type;
    needs_denominator = inputSettingsClass.derivedSettings[0].chart_type_props.needs_denominator;
    needs_sd = inputSettingsClass.derivedSettings[0].chart_type_props.needs_sd;
  }

  if (needs_denominator) {
    const denominatorsPresent: boolean
      = inputDV[0].categorical
                     ?.values
                     ?.some(d => d.source?.roles?.denominators) ?? false;

    if (!denominatorsPresent) {
      return `${chartTypeLabel(chart_type)} kræver en nævner. Tilføj et felt til Nævner.`;
    }
  }

  if (needs_sd) {
    const xbarSDPresent: boolean
      = inputDV[0].categorical
                     ?.values
                     ?.some(d => d.source?.roles?.xbar_sds) ?? false;

    if (!xbarSDPresent) {
      // Feltet med gruppens standardafvigelse er fjernet fra Byg-ruden, så
      // beskeden kan ikke bede om det. Den rammer kun en ældre rapport, der
      // har xbar eller s gemt som diagramtype.
      return `${chartTypeLabel(chart_type)} kan ikke længere beregnes. Vælg en anden diagramtype.`;
    }
  }

  return "valid";
}
