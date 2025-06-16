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

  createReassessment: (originalReportId, reportData) => {
    const { nanoid } = require("nanoid");
    const originalReport = get().reports.find((r) => r.id === originalReportId);
    const newReport = {
      id: nanoid(),
      ...reportData,
      assessmentType: "Reassessment",
      parentAssessmentId: originalReportId,
      parentAssessmentData: originalReport
        ? {
            projectName: originalReport.projectName,
            version: originalReport.version,
            startDate: originalReport.startDate,
            endDate: originalReport.endDate,
            detailedFindings: originalReport.detailedFindings || [],
          }
        : null,
    };
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
      // Store with images intact for persistence
      localStorage.setItem(localStorageKey, JSON.stringify(updatedReports));
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

  getAssessmentsByProject: (projectName) => {
    return get().reports.filter((r) => r.projectName === projectName);
  },
}));

export default useReportsStore;
