import { create } from "zustand";

const localStorageKey = "pentest_settings";

const useSettingsStore = create((set, get) => ({
  defaultLogo: localStorage.getItem(localStorageKey) || "",
  exportPath: localStorage.getItem(localStorageKey + "_exportPath") || "",
  setDefaultLogo: (logo) => {
    set({ defaultLogo: logo });
    localStorage.setItem(localStorageKey, logo);
  },
  setExportPath: (path) => {
    set({ exportPath: path });
    localStorage.setItem(localStorageKey + "_exportPath", path);
  },
}));

export default useSettingsStore;
