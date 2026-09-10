import { dropdownOption } from "./common";

const datesSettings = {
  description: "Datoformat",
  displayName: "Datoformat",
  settingsGroups: {
    "all": {
      date_format_day: dropdownOption("Dagformat", "DD", ["DD", "Thurs DD", "Thursday DD", "(blank)"]),
      date_format_month: dropdownOption("Månedsformat", "MM", ["MM", "Mon", "Month", "(blank)"]),
      date_format_year: dropdownOption("Årsformat", "YYYY", ["YYYY", "YY", "(blank)"]),
      date_format_delim: dropdownOption("Skilletegn", "/", ["/", "-", " "]),
      date_format_locale: dropdownOption("Landestandard", "en-GB", ["en-GB", "en-US"])
    }
  }
};

export default datesSettings;
