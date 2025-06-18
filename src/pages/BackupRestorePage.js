import React, { useState, useContext } from "react";
import { Container, Typography, Button, Alert, Box } from "@mui/material";
import { exportAllData, importAllData } from "../utils/exportData";
import useReportsStore from "../store/useReportsStore";
import { ToastContext } from "../App";

function BackupRestorePage() {
  const [fileError, setFileError] = useState("");
  const [importing, setImporting] = useState(false);
  const { importAndMigrateData } = useReportsStore();
  const toast = useContext(ToastContext);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileError("");
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target.result);

        // Check if this looks like old localStorage backup data
        const isOldFormat = json.reports && Array.isArray(json.reports);
        const reportsData = isOldFormat ? json.reports : json;

        if (window.electronAPI && Array.isArray(reportsData)) {
          // Use the new migration system for Electron
          toast.info("Importing and migrating data...");
          const result = await importAndMigrateData(reportsData);

          if (result.success) {
            toast.success(
              `Successfully imported ${result.imported} reports! ` +
                (result.duplicates > 0
                  ? `(${result.duplicates} duplicates skipped)`
                  : "")
            );

            if (
              reportsData.some((r) =>
                r.detailedFindings?.some((f) => f.pocImages?.length > 0)
              )
            ) {
              toast.info(
                "Images have been migrated to the file system for better performance!"
              );
            }
          } else {
            throw new Error(result.error);
          }
        } else {
          // Fallback to old import method for web version
          importAllData(json);
          toast.success("Data imported successfully!");
        }
      } catch (err) {
        console.error("Import error:", err);
        setFileError(`Import failed: ${err.message}`);
        toast.error("Failed to import data: " + err.message);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Backup & Restore
      </Typography>

      <Box mb={3}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Data Migration:</strong> If you're importing old
            localStorage backups, images will be automatically migrated to the
            file system for better performance and unlimited storage capacity.
          </Typography>
        </Alert>
      </Box>

      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Export Data
        </Typography>
        <Button variant="contained" onClick={exportAllData}>
          Export All Data
        </Button>
      </Box>

      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Import Data
        </Typography>
        <Button variant="outlined" component="label" disabled={importing}>
          {importing ? "Importing..." : "Select Backup JSON"}
          <input
            type="file"
            hidden
            accept="application/json"
            onChange={handleImport}
            disabled={importing}
          />
        </Button>
        {fileError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {fileError}
          </Alert>
        )}
      </Box>

      <Box>
        <Alert severity="warning">
          <Typography variant="body2">
            <strong>Note:</strong> Importing data will merge with existing
            reports. Duplicate reports (same ID) will be skipped to prevent
            conflicts.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
}

export default BackupRestorePage;
