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

  updateFindingInLibrary: (index, updatedFinding) => {
    const updated = [...get().findings];
    updated[index] = updatedFinding;
    set({ findings: updated });
    localStorage.setItem(localStorageKey, JSON.stringify(updated));
  },

  removeFindingFromLibrary: (index) => {
    const updated = [...get().findings];
    updated.splice(index, 1);
    set({ findings: updated });
    localStorage.setItem(localStorageKey, JSON.stringify(updated));
  },

  // Bulk operations
  importFindings: (findings) => {
    const updated = [...get().findings, ...findings];
    set({ findings: updated });
    localStorage.setItem(localStorageKey, JSON.stringify(updated));
  },

  clearLibrary: () => {
    set({ findings: [] });
    localStorage.setItem(localStorageKey, JSON.stringify([]));
  },
}));

export default useFindingsLibraryStore;
