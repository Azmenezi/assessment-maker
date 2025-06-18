import { create } from "zustand";

// Check if running in Electron
const isElectron = () => {
  return window.electronAPI !== undefined;
};

// Fallback localStorage key for web version
const localStorageKey = "pentest_reports";

// Migration function to convert old localStorage data to new format
const migrateOldData = async (oldReports) => {
  const migratedReports = [];

  for (const report of oldReports) {
    const migratedReport = { ...report };

    // Migrate findings with images
    if (report.detailedFindings) {
      migratedReport.detailedFindings = [];

      for (const finding of report.detailedFindings) {
        const migratedFinding = { ...finding };

        // Migrate pocImages to file system if in Electron
        if (finding.pocImages && finding.pocImages.length > 0 && isElectron()) {
          migratedFinding.pocImages = [];

          for (const img of finding.pocImages) {
            try {
              if (img.data && !img.isFileStored) {
                // Save old base64 image to file system
                const result = await window.electronAPI.saveImage(
                  img.data,
                  img.name || "migrated-image.png"
                );

                if (result.success) {
                  migratedFinding.pocImages.push({
                    imageId: result.imageId,
                    name: result.originalFilename,
                    savedFilename: result.savedFilename,
                    isFileStored: true,
                  });
                  console.log(`Migrated image: ${img.name || "unnamed"}`);
                } else {
                  console.warn("Failed to migrate image:", result.error);
                  // Keep original format as fallback
                  migratedFinding.pocImages.push(img);
                }
              } else {
                // Already in new format or no data
                migratedFinding.pocImages.push(img);
              }
            } catch (error) {
              console.error("Error migrating image:", error);
              // Keep original format as fallback
              migratedFinding.pocImages.push(img);
            }
          }
        } else {
          // No images or not in Electron, keep as is
          migratedFinding.pocImages = finding.pocImages || [];
        }

        migratedReport.detailedFindings.push(migratedFinding);
      }
    }

    migratedReports.push(migratedReport);
  }

  return migratedReports;
};

const useReportsStore = create((set, get) => ({
  reports: [],
  isLoading: false,
  error: null,

  // Initialize store - load reports from appropriate storage
  initialize: async () => {
    set({ isLoading: true, error: null });

    try {
      let reports = [];

      if (isElectron()) {
        // Load from Electron file system
        reports = await window.electronAPI.loadReports();

        // Check for old localStorage data to migrate
        const oldData = localStorage.getItem(localStorageKey);
        if (oldData && reports.length === 0) {
          console.log("Found old localStorage data, migrating...");
          const oldReports = JSON.parse(oldData);
          reports = await migrateOldData(oldReports);

          // Save migrated data to file system
          await window.electronAPI.saveReports(reports);

          // Clear old localStorage data after successful migration
          localStorage.removeItem(localStorageKey);
          console.log(
            `Migrated ${reports.length} reports from localStorage to file system`
          );
        }
      } else {
        // Fallback to localStorage for web version
        const stored = localStorage.getItem(localStorageKey);
        reports = stored ? JSON.parse(stored) : [];
      }

      set({ reports, isLoading: false });
      return { success: true };
    } catch (error) {
      console.error("Error initializing reports store:", error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Manual migration function for importing backup data
  importAndMigrateData: async (backupData) => {
    try {
      let reportsToImport = [];

      if (typeof backupData === "string") {
        reportsToImport = JSON.parse(backupData);
      } else {
        reportsToImport = backupData;
      }

      // Migrate the imported data
      const migratedReports = await migrateOldData(reportsToImport);

      // Merge with existing reports (avoid duplicates by ID)
      const currentReports = get().reports;
      const existingIds = new Set(currentReports.map((r) => r.id));
      const newReports = migratedReports.filter((r) => !existingIds.has(r.id));

      const updatedReports = [...currentReports, ...newReports];

      // Save to storage
      const result = await get().saveReports(updatedReports);

      if (result.success) {
        return {
          success: true,
          imported: newReports.length,
          duplicates: migratedReports.length - newReports.length,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error importing data:", error);
      return { success: false, error: error.message };
    }
  },

  // Save reports to appropriate storage
  saveReports: async (reports) => {
    try {
      if (isElectron()) {
        // Save to Electron file system
        const result = await window.electronAPI.saveReports(reports);
        if (!result.success) {
          throw new Error(result.error);
        }
      } else {
        // Fallback to localStorage for web version
        localStorage.setItem(localStorageKey, JSON.stringify(reports));
      }

      set({ reports });
      return { success: true };
    } catch (error) {
      console.error("Error saving reports:", error);
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  createReport: async (reportData) => {
    const { nanoid } = await import("nanoid");
    const newReport = { id: nanoid(), ...reportData };

    const currentReports = get().reports;
    const updatedReports = [...currentReports, newReport];

    const result = await get().saveReports(updatedReports);
    if (result.success) {
      return newReport.id;
    } else {
      throw new Error(result.error);
    }
  },

  createReassessment: async (originalReportId, reportData) => {
    const { nanoid } = await import("nanoid");
    const originalReport = get().reports.find((r) => r.id === originalReportId);

    // Calculate next version number
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
    const updatedReports = [...currentReports, newReport];

    const result = await get().saveReports(updatedReports);
    if (result.success) {
      return newReport.id;
    } else {
      throw new Error(result.error);
    }
  },

  updateReport: async (id, updatedData) => {
    const currentReports = get().reports;
    const updatedReports = currentReports.map((r) =>
      r.id === id ? { ...r, ...updatedData } : r
    );

    await get().saveReports(updatedReports);
  },

  getReportById: (id) => get().reports.find((r) => r.id === id),

  deleteReport: async (id) => {
    const currentReports = get().reports;
    const updatedReports = currentReports.filter((r) => r.id !== id);

    await get().saveReports(updatedReports);
  },

  getAssessmentsByProject: (projectName) => {
    return get().reports.filter((r) => r.projectName === projectName);
  },
}));

export default useReportsStore;
