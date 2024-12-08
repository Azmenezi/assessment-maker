import { create } from "zustand";

const localStorageKey = "pentest_findings_library";

const initialLibrary = JSON.parse(localStorage.getItem(localStorageKey)) || [];

const useFindingsLibraryStore = create((set, get) => ({
  findings: initialLibrary,

  addFindingToLibrary: (finding) => {
    const updated = [...get().findings, finding];
    set({ findings: updated });
    localStorage.setItem(localStorageKey, JSON.stringify(updated));
  },

  // Optionally remove or edit from library
  removeFindingFromLibrary: (index) => {
    const updated = [...get().findings];
    updated.splice(index, 1);
    set({ findings: updated });
    localStorage.setItem(localStorageKey, JSON.stringify(updated));
  },
}));

export default useFindingsLibraryStore;
