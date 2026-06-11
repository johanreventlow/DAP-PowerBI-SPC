import { toggleOption } from "./common";

const downloadSettings = {
  description: "Download",
  displayName: "Download",
  settingsGroups: {
    "all": {
      show_button: toggleOption("Vis download-knap", false)
    }
  }
};

export default downloadSettings;
