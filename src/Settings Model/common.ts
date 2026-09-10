import isNullOrUndefined from "../Functions/isNullOrUndefined";
import type powerbi from "powerbi-visuals-api";

const FormattingComponent = {
  AlignmentGroup: "AlignmentGroup" as powerbi.visuals.FormattingComponent.AlignmentGroup,
  ColorPicker: "ColorPicker" as powerbi.visuals.FormattingComponent.ColorPicker,
  Dropdown: "Dropdown" as powerbi.visuals.FormattingComponent.Dropdown,
  FontPicker: "FontPicker" as powerbi.visuals.FormattingComponent.FontPicker,
  NumUpDown: "NumUpDown" as powerbi.visuals.FormattingComponent.NumUpDown,
  TextInput: "TextInput" as powerbi.visuals.FormattingComponent.TextInput,
  ToggleSwitch: "ToggleSwitch" as powerbi.visuals.FormattingComponent.ToggleSwitch,
} as const;

type FormattingComponentKeys = keyof typeof FormattingComponent;

const defaultColours: Record<string, string> = {
  // Observationer uden for kontrolgrænserne. Én farve, ens over og under:
  // qicharts2's sigma.signal er en ren boolean per punkt og fortolker ikke,
  // om afvigelsen er ønsket. Lilla frem for rød/grøn, netop for ikke at
  // antyde en vurdering.
  beyond_limit: "#490092",
  common_cause: "#A6A6A6",
  limits: "#6495ED",
  standard: "#000000",
  lightgray: "#D3D3D3",
  white: "#FFFFFF",
  // Signal highlight in the SPC panel: a filled box with reversed text,
  // matching the direktionsmøde layout. Grey rather than a hue so the
  // marking survives greyscale printing and colour-vision deficiency.
  signal_box: "#8C8C8C"
};

type UndefinedOrNumT<T> = T extends undefined ? undefined | number : T;
type NumOptionType<T> = {
  displayName: string;
  type: Extract<powerbi.visuals.FormattingComponent, "NumUpDown">
  default: UndefinedOrNumT<T>;
  options?: { minValue?: { value: number }; maxValue?: { value: number }; }
};

function numberOption<T>(displayName: string, defaultValue: T, minMax?: { min?: number, max?: number }) {
  const rtn: NumOptionType<T> = {
    displayName: displayName,
    type: FormattingComponent.NumUpDown,
    default: defaultValue as UndefinedOrNumT<T>
  };
  if (!isNullOrUndefined(minMax)) {
    rtn.options = {};
    if (!isNullOrUndefined(minMax.min)) {
      rtn.options.minValue = { value: minMax.min };
    }
    if (!isNullOrUndefined(minMax.max)) {
      rtn.options.maxValue = { value: minMax.max };
    }
  }
  return rtn;
}

function toggleOption(displayName: string, defaultValue: boolean) {
  return {
    displayName: displayName,
    type: FormattingComponent.ToggleSwitch,
    default: defaultValue
  }
}

function paddingOption(displayName: string) {
  return numberOption(displayName, 10);
}

function colourOption(displayName: string, type: string) {
  return {
    displayName: displayName,
    type: FormattingComponent.ColorPicker,
    default: defaultColours[type]
  }
}

function fontOption(displayName: string) {
  return {
    displayName: displayName,
    type: FormattingComponent.FontPicker,
    default: "'Arial', sans-serif",
    valid: [
      "'Arial', sans-serif",
      "Arial",
      "'Arial Black'",
      "'Arial Unicode MS'",
      "Calibri",
      "Cambria",
      "'Cambria Math'",
      "Candara",
      "'Comic Sans MS'",
      "Consolas",
      "Constantia",
      "Corbel",
      "'Courier New'",
      "wf_standard-font, helvetica, arial, sans-serif",
      "wf_standard-font_light, helvetica, arial, sans-serif",
      "Georgia",
      "'Lucida Sans Unicode'",
      "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif",
      "'Segoe UI Light', wf_segoe-ui_light, helvetica, arial, sans-serif",
      "'Segoe UI Semibold', wf_segoe-ui_semibold, helvetica, arial, sans-serif",
      "'Segoe UI Bold', wf_segoe-ui_bold, helvetica, arial, sans-serif",
      "Symbol",
      "Tahoma",
      "'Times New Roman'",
      "'Trebuchet MS'",
      "Verdana",
      "Wingdings"
    ]
  }
}

function fontSizeOption(displayName: string) {
  return numberOption(displayName, 10, { min: 0, max: 100 });
}

type DropdownItem = { displayName: string; value: string; }
const valueTransforms: Record<string, (x: string) => string> = {
  none: (x: string) => x,
  sentence: (x: string) => x.toLowerCase().replace(/\b\w/g, (char: string) => char.toUpperCase())
};

/**
 * @param hiddenValues - Værdier der forbliver gyldige, men ikke tilbydes i
 *   dropdownen. `valid` er hvidlisten i extractConditionalFormatting: en gemt
 *   værdi udenfor den erstattes af default og udløser en fejlbesked til
 *   brugeren. Skal en indstilling kunne trækkes tilbage uden at ødelægge
 *   rapporter, der allerede bruger den, skal den altså blive i `valid` og kun
 *   forsvinde fra `items`.
 */
function dropdownOption(displayName: string, defaultValue: string,
                        validValues: string[], displayTransform?: string,
                        displayNames?: string[], hiddenValues?: string[]) {
  const rtn = {
    displayName: displayName,
    type: FormattingComponent.Dropdown,
    default: defaultValue,
    valid: validValues,
    items: new Array<DropdownItem>()
  };

  const transformFun: (x: string) => string = valueTransforms[(displayTransform ?? "none")]

  for (let i: number = 0; i < validValues.length; i++) {
    if (hiddenValues?.includes(validValues[i])) {
      continue;
    }
    rtn.items.push({
      displayName: displayNames ? displayNames[i] : transformFun(validValues[i]),
      value: validValues[i]
    })
  }

  return rtn;
}

function lineTypeOption(displayName: string, defaultValue: string) {
  return dropdownOption(displayName, defaultValue, ["10 0", "10 10", "2 5"], "none", ["Solid", "Dashed", "Dotted"])
}

function textOption(displayName: string, defaultValue: string) {
  return {
    displayName: displayName,
    type: FormattingComponent.TextInput,
    default: defaultValue
  }
}

function lineLabelPositionOption() {
  return dropdownOption("Position of Value on Line(s)", "beside",
                        ["outside", "inside", "above", "below", "beside"],
                        "sentence");
}

function borderStyleOption(displayName: string) {
  return dropdownOption(
    displayName, "solid",
    ["solid", "dotted", "dashed", "double", "groove", "ridge", "inset", "outset", "none"],
    "sentence"
  )
}

function borderWidthOption(displayName: string) {
  return numberOption(displayName, 1, { min: 0 });
}

function alignmentOption(displayName: string) {
  return {
    displayName: displayName,
    type: FormattingComponent.AlignmentGroup,
    default: "center",
    valid: ["center", "left", "right"]
  }
}

function fontWeightOption(displayName: string) {
  return dropdownOption(
    displayName,
    "normal",
    ["normal", "bold", "bolder", "lighter"],
    "sentence"
  )
}

function textTransformOption(displayName: string) {
  return dropdownOption(
    displayName,
    "capitalize",
    ["uppercase", "lowercase", "capitalize", "none"],
    "sentence"
  )
}


type ExpandRecursive<T> = T extends object
  ? T extends infer O ? { [K in keyof O]: ExpandRecursive<O[K]> } : never
  : T;

type MergeUnions<T> = ExpandRecursive<(T extends any ? (x: T) => void : never) extends (x: infer R) => void
  ? { [K in keyof R]: R[K] }
  : never>;

type settingsGroups<T> = Extract<keyof T, "settingsGroups">;
type settingsGroupMembers<T> = MergeUnions<T[settingsGroups<T>][keyof T[settingsGroups<T>]]>;
type DefaultTypes<T> = T[Extract<keyof T, "default">];

type SettingDefaultTypes<T> = ExpandRecursive<{
  [L in keyof settingsGroupMembers<T>]: DefaultTypes<settingsGroupMembers<T>[L]>
}>;
type SettingMembers<T> = ExpandRecursive<{
  [L in keyof settingsGroupMembers<T>]: settingsGroupMembers<T>[L]
}>;



function addGetters<T extends { settingsGroups: Record<string, any> }>(
  settingCategory: T): ExpandRecursive<T & SettingMembers<T> & { settingNames: string[]}> {
  let inputClone = JSON.parse(JSON.stringify(settingCategory)) as T; // to avoid mutating original object, which can cause issues with imports
  let settingNames: string[] = [];
  for (const group in inputClone.settingsGroups) {
    for (const setting in inputClone.settingsGroups[group]) {
      settingNames.push(setting);
      Object.defineProperty(inputClone, setting, {
        get: function() {
          return inputClone.settingsGroups[group][setting]
        }
      });
    }
  }
  Object.defineProperty(inputClone, "settingNames", {
    get: function() {
      return settingNames;
    }
  });
  return inputClone as unknown as ExpandRecursive<T & SettingMembers<T> & { settingNames: string[] }>;
}

export {
  FormattingComponent,
  type FormattingComponentKeys,
  paddingOption,
  colourOption,
  fontOption,
  fontSizeOption,
  lineTypeOption,
  toggleOption,
  numberOption,
  textOption,
  lineLabelPositionOption,
  dropdownOption,
  borderStyleOption,
  borderWidthOption,
  alignmentOption,
  fontWeightOption,
  textTransformOption,
  addGetters,
  type SettingDefaultTypes,
  type ExpandRecursive,
  type MergeUnions
};
