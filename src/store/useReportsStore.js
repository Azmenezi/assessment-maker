import { create } from "zustand";
import apiService from "../services/api";

const useReportsStore = create((set, get) => ({
  reports: [],
  loading: false,
  error: null,

  // Initialize reports from API
  initializeReports: async () => {
    set({ loading: true, error: null });
    const startTime = performance.now();

    try {
      const reports = await apiService.getAllReports();
      const endTime = performance.now();
      const loadTime = Math.round(endTime - startTime);

      console.log(
        `📊 Reports loaded in ${loadTime}ms (${reports.length} reports)`
      );
      set({ reports, loading: false });
    } catch (error) {
      const endTime = performance.now();
      const loadTime = Math.round(endTime - startTime);

      console.error(`❌ Failed to load reports after ${loadTime}ms:`, error);
      set({ error: error.message, loading: false });

      // Fallback to localStorage for offline mode
      const localReports =
        JSON.parse(localStorage.getItem("pentest_reports")) || [];
      set({ reports: localReports });
    }
  },

  createReport: async (reportData) => {
    set({ loading: true, error: null });
    try {
      const result = await apiService.createReport(reportData);

      // Refresh reports list
      await get().initializeReports();

      return result.id;
    } catch (error) {
      console.error("Failed to create report:", error);
      set({ error: error.message, loading: false });

      // Fallback to localStorage
      const { nanoid } = require("nanoid");
      const newReport = { id: nanoid(), ...reportData };
      const currentReports = get().reports;
      const updated = [...currentReports, newReport];
      localStorage.setItem("pentest_reports", JSON.stringify(updated));
      set({ reports: updated, loading: false });
      return newReport.id;
    }
  },

  createReassessment: async (originalReportId, reportData) => {
    set({ loading: true, error: null });
    try {
      const result = await apiService.createReassessment(
        originalReportId,
        reportData
      );

      // Refresh reports list
      await get().initializeReports();

      return result.id;
    } catch (error) {
      console.error("Failed to create reassessment:", error);
      set({ error: error.message, loading: false });

      // Fallback to localStorage logic
      const { nanoid } = require("nanoid");
      const originalReport = get().reports.find(
        (r) => r.id === originalReportId
      );

      // Calculate next version
      let nextVersion = "1.0";
      if (originalReport) {
        const currentVersion = parseFloat(originalReport.version) || 1.0;
        nextVersion = (currentVersion + 1.0).toFixed(1);
      }

      const newReport = {
        id: nanoid(),
        ...reportData,
        version: nextVersion,
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

      const currentReports = get().reports;
      const updated = [...currentReports, newReport];
      localStorage.setItem("pentest_reports", JSON.stringify(updated));
      set({ reports: updated, loading: false });
      return newReport.id;
    }
  },

  updateReport: async (id, updatedData) => {
    set({ loading: true, error: null });
    try {
      await apiService.updateReport(id, updatedData);

      // Update local state optimistically
      const currentReports = get().reports;
      const updatedReports = currentReports.map((r) =>
        r.id === id ? { ...r, ...updatedData } : r
      );
      set({ reports: updatedReports, loading: false });
    } catch (error) {
      console.error("Failed to update report:", error);
      set({ error: error.message, loading: false });

      // Fallback to localStorage
      const currentReports = get().reports;
      const updatedReports = currentReports.map((r) =>
        r.id === id ? { ...r, ...updatedData } : r
      );
      localStorage.setItem("pentest_reports", JSON.stringify(updatedReports));
      set({ reports: updatedReports });
    }
  },

  getReportById: (id) => get().reports.find((r) => r.id === id),

  deleteReport: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiService.deleteReport(id);

      // Update local state
      const currentReports = get().reports;
      const filtered = currentReports.filter((r) => r.id !== id);
      set({ reports: filtered, loading: false });
    } catch (error) {
      console.error("Failed to delete report:", error);
      set({ error: error.message, loading: false });

      // Fallback to localStorage
      const currentReports = get().reports;
      const filtered = currentReports.filter((r) => r.id !== id);
      localStorage.setItem("pentest_reports", JSON.stringify(filtered));
      set({ reports: filtered });
    }
  },

  getAssessmentsByProject: (projectName) => {
    return get().reports.filter((r) => r.projectName === projectName);
  },

  // Clear error state
  clearError: () => set({ error: null }),
}));

export default useReportsStore;
