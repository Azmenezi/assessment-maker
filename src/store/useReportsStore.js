import { create } from "zustand";

const localStorageKey = "pentest_reports";

const useReportsStore = create((set, get) => ({
  reports: JSON.parse(localStorage.getItem(localStorageKey)) || [],

  createReport: (reportData) => {
    const { nanoid } = require("nanoid");
    const newReport = { id: nanoid(), ...reportData };
    set((state) => {
      const updated = [...state.reports, newReport];
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
      return { reports: updated };
    });
    return newReport.id;
  },

  updateReport: (id, updatedData) => {
    set((state) => {
      const updatedReports = state.reports.map((r) =>
        r.id === id ? { ...r, ...updatedData } : r
      );
      const noPoCReports = updatedReports.map((report) => {
        const newFindings = report.detailedFindings.map((finding) => {
          return {
            ...finding,
            pocImages: finding.pocImages.map((img) => {
              return { name: img.name };
            }),
          };
        });
        return {
          ...report,
          detailedFindings: newFindings,
        };
      });
      localStorage.setItem(localStorageKey, JSON.stringify(noPoCReports));
      return { reports: updatedReports };
    });
  },

  getReportById: (id) => get().reports.find((r) => r.id === id),

  deleteReport: (id) => {
    set((state) => {
      const filtered = state.reports.filter((r) => r.id !== id);
      localStorage.setItem(localStorageKey, JSON.stringify(filtered));
      return { reports: filtered };
    });
  },
}));

export default useReportsStore;
