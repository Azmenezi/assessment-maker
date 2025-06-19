import {
  Cloud as CloudIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { ToastContext } from "../App";
import apiService from "../services/api";
import useReportsStore from "../store/useReportsStore";

function BackupRestorePage() {
  const toast = useContext(ToastContext);
  const { reports, initializeReports, loading } = useReportsStore();

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // Calculate storage statistics
  useEffect(() => {
    calculateStorageStats();
    // eslint-disable-next-line
  }, [reports]);

  const calculateStorageStats = () => {
    try {
      // localStorage stats
      let localStorageSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageSize += localStorage[key].length + key.length;
        }
      }

      const localReports =
        JSON.parse(localStorage.getItem("pentest_reports")) || [];
      const localImagesCount = localReports.reduce((total, report) => {
        return (
          total +
          (report.detailedFindings || []).reduce((findingTotal, finding) => {
            return findingTotal + (finding.pocImages || []).length;
          }, 0)
        );
      }, 0);

      // Database stats (from current reports)
      const dbImagesCount = reports.reduce((total, report) => {
        return (
          total +
          (report.detailedFindings || []).reduce((findingTotal, finding) => {
            return findingTotal + (finding.pocImages || []).length;
          }, 0)
        );
      }, 0);

      setStorageStats({
        localStorage: {
          size: localStorageSize,
          reports: localReports.length,
          images: localImagesCount,
        },
        database: {
          reports: reports.length,
          images: dbImagesCount,
        },
      });
    } catch (error) {
      console.error("Error calculating storage stats:", error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Export localStorage data
  const exportLocalStorageData = () => {
    try {
      setExporting(true);
      const data = localStorage.getItem("pentest_reports");

      if (!data || data === "[]") {
        toast.warning("No localStorage data found to export");
        return;
      }

      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `assessment-maker-localStorage-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("localStorage data exported successfully!");
    } catch (error) {
      toast.error("Failed to export localStorage data: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  // Export database data
  const exportDatabaseData = async () => {
    try {
      setExporting(true);

      // Get all reports from API
      const allReports = await apiService.getAllReports();

      if (allReports.length === 0) {
        toast.warning("No database data found to export");
        return;
      }

      const exportData = JSON.stringify(allReports, null, 2);
      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `assessment-maker-database-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        `Database data exported successfully! (${allReports.length} reports)`
      );
    } catch (error) {
      toast.error("Failed to export database data: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  // Import data (supports both localStorage and database formats)
  const importData = (file, targetStorage) => {
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const jsonData = JSON.parse(evt.target.result);

        if (!Array.isArray(jsonData)) {
          throw new Error("Invalid format: Expected an array of reports");
        }

        if (jsonData.length === 0) {
          toast.warning("No reports found in the file");
          return;
        }

        if (targetStorage === "localStorage") {
          // Import to localStorage
          const existingData =
            JSON.parse(localStorage.getItem("pentest_reports")) || [];
          const mergedData = [...existingData, ...jsonData];

          // Remove duplicates based on ID
          const uniqueData = mergedData.filter(
            (report, index, self) =>
              index === self.findIndex((r) => r.id === report.id)
          );

          localStorage.setItem("pentest_reports", JSON.stringify(uniqueData));
          toast.success(`Imported ${jsonData.length} reports to localStorage`);
        } else {
          // Import to database via API
          let successCount = 0;
          let errorCount = 0;

          for (const report of jsonData) {
            try {
              await apiService.createReport(report);
              successCount++;
            } catch (error) {
              errorCount++;
              console.error(
                `Failed to import report ${report.projectName}:`,
                error
              );
            }
          }

          toast.success(`Imported ${successCount} reports to database`);
          if (errorCount > 0) {
            toast.warning(
              `${errorCount} reports failed to import (possibly duplicates)`
            );
          }

          // Refresh reports list
          await initializeReports();
        }

        calculateStorageStats();
      } catch (error) {
        toast.error("Failed to import data: " + error.message);
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  // Migrate localStorage to database
  const migrateToDatabase = async () => {
    try {
      setMigrating(true);

      const localData = localStorage.getItem("pentest_reports");
      if (!localData || localData === "[]") {
        toast.warning("No localStorage data found to migrate");
        return;
      }

      const reports = JSON.parse(localData);

      // Use bulk create endpoint that handles findings and images
      const result = await apiService.bulkCreateReports(reports);

      toast.success(
        `Migration completed! ${result.successCount} reports migrated to database`
      );
      if (result.errorCount > 0) {
        toast.warning(
          `${result.errorCount} reports failed to migrate (possibly duplicates)`
        );
      }

      // Refresh reports list
      await initializeReports();
      calculateStorageStats();
    } catch (error) {
      toast.error("Migration failed: " + error.message);
    } finally {
      setMigrating(false);
    }
  };

  // Clear localStorage data
  const clearLocalStorage = () => {
    setConfirmDialog({
      open: true,
      title: "Clear localStorage Data",
      message:
        "This will permanently delete all localStorage data. Make sure you have exported it first. This action cannot be undone.",
      onConfirm: () => {
        localStorage.removeItem("pentest_reports");
        toast.success("localStorage data cleared");
        calculateStorageStats();
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  // Clear database data
  const clearDatabase = () => {
    setConfirmDialog({
      open: true,
      title: "Clear Database Data",
      message:
        "This will permanently delete all database data. Make sure you have exported it first. This action cannot be undone.",
      onConfirm: async () => {
        try {
          // Delete all reports (this should cascade to findings and images)
          for (const report of reports) {
            await apiService.deleteReport(report.id);
          }
          toast.success("Database data cleared");
          await initializeReports();
          calculateStorageStats();
        } catch (error) {
          toast.error("Failed to clear database: " + error.message);
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Data Management & Migration
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your assessment data across localStorage and database storage
        systems. Export for backups, import from other systems, and migrate
        between storage types.
      </Typography>

      {/* Storage Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StorageIcon sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">localStorage Storage</Typography>
                <Tooltip title="Browser-based storage with ~5MB limit">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {storageStats && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Size: {formatBytes(storageStats.localStorage.size)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reports: {storageStats.localStorage.reports}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Images: {storageStats.localStorage.images}
                  </Typography>
                  <Box mt={1}>
                    <Chip
                      label="Legacy Storage"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CloudIcon sx={{ mr: 1, color: "success.main" }} />
                <Typography variant="h6">Database Storage</Typography>
                <Tooltip title="SQLite database with unlimited storage">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {storageStats && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Reports: {storageStats.database.reports}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Images: {storageStats.database.images}
                  </Typography>
                  <Box mt={1}>
                    <Chip
                      label="Current Storage"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Export Data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create backups of your data for safekeeping or transfer to another
          system.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportLocalStorageData}
              disabled={exporting || !storageStats?.localStorage.reports}
              fullWidth
              sx={{ mb: 1 }}
            >
              Export localStorage Data
            </Button>
            <Typography variant="caption" color="text.secondary">
              Export legacy browser storage data
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportDatabaseData}
              disabled={exporting || !storageStats?.database.reports}
              fullWidth
              sx={{ mb: 1 }}
            >
              Export Database Data
            </Button>
            <Typography variant="caption" color="text.secondary">
              Export current database with all images
            </Typography>
          </Grid>
        </Grid>

        {exporting && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Preparing export...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Import Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Import Data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Import data from backup files. Choose your target storage system.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              component="label"
              disabled={importing}
              fullWidth
              sx={{ mb: 1 }}
            >
              Import to localStorage
              <input
                type="file"
                hidden
                accept=".json,application/json"
                onChange={(e) => importData(e.target.files[0], "localStorage")}
              />
            </Button>
            <Typography variant="caption" color="text.secondary">
              Import to browser storage (legacy)
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              component="label"
              disabled={importing}
              fullWidth
              sx={{ mb: 1 }}
            >
              Import to Database
              <input
                type="file"
                hidden
                accept=".json,application/json"
                onChange={(e) => importData(e.target.files[0], "database")}
              />
            </Button>
            <Typography variant="caption" color="text.secondary">
              Import to SQLite database (recommended)
            </Typography>
          </Grid>
        </Grid>

        {importing && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Importing data...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Migration Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Data Migration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Migrate your data from localStorage to the new database system for
          better performance and unlimited storage.
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Recommended:</strong> Migrate your localStorage data to the
            database for better performance, unlimited storage, and improved
            reliability. Your localStorage data will remain intact as a backup.
          </Typography>
        </Alert>

        <Box display="flex" gap={2} alignItems="center">
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudIcon />}
            onClick={migrateToDatabase}
            disabled={migrating || !storageStats?.localStorage.reports}
          >
            Migrate localStorage → Database
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              initializeReports();
              calculateStorageStats();
            }}
            disabled={loading}
          >
            Refresh Stats
          </Button>
        </Box>

        {migrating && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Migrating data to database...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Danger Zone */}
      <Paper sx={{ p: 3, border: "1px solid", borderColor: "error.main" }}>
        <Typography variant="h5" gutterBottom color="error">
          Danger Zone
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Permanently delete data. Make sure you have backups before proceeding.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={clearLocalStorage}
              disabled={!storageStats?.localStorage.reports}
              fullWidth
            >
              Clear localStorage Data
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={clearDatabase}
              disabled={!storageStats?.database.reports}
              fullWidth
            >
              Clear Database Data
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDialog.onConfirm}
            color="error"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default BackupRestorePage;
