import { create } from "zustand";

const localStorageKey = "pentest_settings";

const useSettingsStore = create((set, get) => ({
  defaultLogo: localStorage.getItem(localStorageKey) || "",
  setDefaultLogo: (logo) => {
    set({ defaultLogo: logo });
    localStorage.setItem(localStorageKey, logo);
  },
}));

export default useSettingsStore;
