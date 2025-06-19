import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import EditIcon from "@mui/icons-material/Edit";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
} from "@mui/material";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import useReportsStore from "../store/useReportsStore";
import { ToastContext } from "../App";

function filterReports(
  reports,
  {
    fromDate,
    toDate,
    searchTerm,
    openOnly,
    projectStatus,
    assessmentType,
    severityFilter,
    sortBy,
    sortOrder,
  }
) {
  let filtered = reports.filter((report) => {
    const reportStart = new Date(report.startDate);
    const reportEnd = new Date(report.endDate);

    // Filter by date range
    if (fromDate && reportStart < new Date(fromDate)) {
      return false;
    }
    if (toDate && reportEnd > new Date(toDate)) {
      return false;
    }

    // Filter by project status
    if (projectStatus && projectStatus !== "All") {
      if (report.projectStatus !== projectStatus) {
        return false;
      }
    }

    // Filter by assessment type
    if (assessmentType && assessmentType !== "All") {
      if (report.assessmentType !== assessmentType) {
        return false;
      }
    }

    // Filter by search term (in projectName, assessorName, platform, or findings title)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = report.projectName?.toLowerCase().includes(searchLower);
      const assessorMatch = report.assessorName
        ?.toLowerCase()
        .includes(searchLower);
      const platformMatch = report.platform
        ?.toLowerCase()
        .includes(searchLower);
      const ticketMatch = report.ticketNumber
        ?.toLowerCase()
        .includes(searchLower);
      const findingMatch = report.detailedFindings?.some(
        (f) =>
          f.title?.toLowerCase().includes(searchLower) ||
          f.category?.toLowerCase().includes(searchLower) ||
          f.description?.toLowerCase().includes(searchLower)
      );
      if (
        !nameMatch &&
        !assessorMatch &&
        !platformMatch &&
        !ticketMatch &&
        !findingMatch
      ) {
        return false;
      }
    }

    // Filter by severity
    if (severityFilter && severityFilter !== "All") {
      const hasSeverity = report.detailedFindings?.some(
        (f) => f.severity === severityFilter
      );
      if (!hasSeverity) {
        return false;
      }
    }

    // Filter by openOnly
    if (openOnly) {
      const hasOpen = report.detailedFindings?.some((f) => f.status === "OPEN");
      if (!hasOpen) return false;
    }

    return true;
  });

  // Sort the filtered results
  if (sortBy) {
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "projectName":
          aValue = a.projectName?.toLowerCase() || "";
          bValue = b.projectName?.toLowerCase() || "";
          break;
        case "startDate":
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case "endDate":
          aValue = new Date(a.endDate);
          bValue = new Date(b.endDate);
          break;
        case "assessorName":
          aValue = a.assessorName?.toLowerCase() || "";
          bValue = b.assessorName?.toLowerCase() || "";
          break;
        case "projectStatus":
          aValue = a.projectStatus?.toLowerCase() || "";
          bValue = b.projectStatus?.toLowerCase() || "";
          break;
        case "findingsCount":
          aValue = a.detailedFindings?.length || 0;
          bValue = b.detailedFindings?.length || 0;
          break;
        default:
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }

  return filtered;
}

function ReportsFilter({ onFilterChange }) {
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [openOnly, setOpenOnly] = React.useState(false);
  const [projectStatus, setProjectStatus] = React.useState("All");
  const [assessmentType, setAssessmentType] = React.useState("All");
  const [severityFilter, setSeverityFilter] = React.useState("All");
  const [sortBy, setSortBy] = React.useState("startDate");
  const [sortOrder, setSortOrder] = React.useState("desc");

  const projectStatusOptions = [
    "All",
    "In Progress",
    "Complete",
    "Completed with Exception",
    "Waiting for Fixes",
    "Waiting for Client Response",
    "On Hold",
    "Cancelled",
    "Ready for Review",
    "Under Review",
  ];

  const severityOptions = [
    "All",
    "Critical",
    "High",
    "Medium",
    "Low",
    "Informational",
  ];
  const sortOptions = [
    { value: "startDate", label: "Start Date" },
    { value: "endDate", label: "End Date" },
    { value: "projectName", label: "Project Name" },
    { value: "assessorName", label: "Assessor Name" },
    { value: "projectStatus", label: "Project Status" },
    { value: "findingsCount", label: "Findings Count" },
  ];

  React.useEffect(() => {
    onFilterChange({
      fromDate,
      toDate,
      searchTerm,
      openOnly,
      projectStatus,
      assessmentType,
      severityFilter,
      sortBy,
      sortOrder,
    });
  }, [
    fromDate,
    toDate,
    searchTerm,
    openOnly,
    projectStatus,
    assessmentType,
    severityFilter,
    sortBy,
    sortOrder,
    onFilterChange,
  ]);

  return (
    <Paper elevation={2} style={{ marginBottom: 20 }}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <FilterListIcon />
            <Typography variant="h6">Search & Filter Options</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Search */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search (Project, Assessor, Platform, Ticket, Findings)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search across all fields..."
              />
            </Grid>

            {/* Date Range */}
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="From Date"
                InputLabelProps={{ shrink: true }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="To Date"
                InputLabelProps={{ shrink: true }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Grid>

            {/* Status Filters */}
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Project Status</InputLabel>
                <Select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                  label="Project Status"
                >
                  {projectStatusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Assessment Type</InputLabel>
                <Select
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                  label="Assessment Type"
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Initial">Initial</MenuItem>
                  <MenuItem value="Reassessment">Reassessment</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Severity Filter</InputLabel>
                <Select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  label="Severity Filter"
                >
                  {severityOptions.map((severity) => (
                    <MenuItem key={severity} value={severity}>
                      {severity}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Sorting */}
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Checkboxes */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} flexWrap="wrap">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={openOnly}
                      onChange={(e) => setOpenOnly(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Show Only Reports with Open Findings"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sortOrder === "desc"}
                      onChange={(e) =>
                        setSortOrder(e.target.checked ? "desc" : "asc")
                      }
                      color="primary"
                    />
                  }
                  label="Descending Order"
                />
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}

function Home() {
  const reports = useReportsStore((state) => state.reports);
  const updateReport = useReportsStore((state) => state.updateReport);
  const navigate = useNavigate();
  const toast = useContext(ToastContext);

  const [filters, setFilters] = React.useState({
    fromDate: "",
    toDate: "",
    searchTerm: "",
    openOnly: false,
    projectStatus: "All",
    assessmentType: "All",
    severityFilter: "All",
    sortBy: "startDate",
    sortOrder: "desc",
  });

  // Bulk edit state
  const [bulkEditMode, setBulkEditMode] = React.useState(false);
  const [selectedReports, setSelectedReports] = React.useState(new Set());
  const [bulkEditDialog, setBulkEditDialog] = React.useState(false);
  const [bulkStatus, setBulkStatus] = React.useState("");
  const [bulkFixByDate, setBulkFixByDate] = React.useState("");

  const filteredReports = React.useMemo(() => {
    return filterReports(reports, filters);
  }, [reports, filters]);

  // Get findings count and open findings count for each report
  const getReportStats = (report) => {
    const totalFindings = report.detailedFindings?.length || 0;
    const openFindings =
      report.detailedFindings?.filter((f) => f.status === "OPEN").length || 0;
    return { totalFindings, openFindings };
  };

  // Get status color for project status
  const getStatusColor = (status) => {
    switch (status) {
      case "Complete":
        return "success";
      case "Completed with Exception":
        return "warning";
      case "In Progress":
        return "info";
      case "Waiting for Fixes":
      case "Waiting for Client Response":
        return "warning";
      case "On Hold":
      case "Cancelled":
        return "error";
      case "Ready for Review":
      case "Under Review":
        return "secondary";
      default:
        return "default";
    }
  };

  const projectStatusOptions = [
    "In Progress",
    "Complete",
    "Completed with Exception",
    "Waiting for Fixes",
    "Waiting for Client Response",
    "On Hold",
    "Cancelled",
    "Ready for Review",
    "Under Review",
  ];

  // Bulk edit functions
  const handleSelectAll = () => {
    if (selectedReports.size === filteredReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(filteredReports.map((r) => r.id)));
    }
  };

  const handleSelectReport = (reportId) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  const handleBulkStatusChange = async () => {
    if (!bulkStatus || selectedReports.size === 0) return;

    // Validate fix-by date if status is "Completed with Exception"
    if (bulkStatus === "Completed with Exception" && !bulkFixByDate) {
      toast.error(
        "Please select a fix-by date for 'Completed with Exception' status"
      );
      return;
    }

    try {
      const updatePromises = Array.from(selectedReports).map((reportId) => {
        const report = reports.find((r) => r.id === reportId);
        const updatedReport = {
          ...report,
          projectStatus: bulkStatus,
        };

        // Add fix-by date if status is "Completed with Exception"
        if (bulkStatus === "Completed with Exception") {
          updatedReport.fixByDate = bulkFixByDate;
        } else {
          // Remove fix-by date if changing from "Completed with Exception" to another status
          delete updatedReport.fixByDate;
        }

        return updateReport(reportId, updatedReport);
      });

      await Promise.all(updatePromises);

      toast.success(
        `Updated ${selectedReports.size} reports to "${bulkStatus}"${
          bulkStatus === "Completed with Exception"
            ? ` (Fix by: ${bulkFixByDate})`
            : ""
        }`
      );
      setSelectedReports(new Set());
      setBulkEditDialog(false);
      setBulkEditMode(false);
      setBulkStatus("");
      setBulkFixByDate("");
    } catch (error) {
      toast.error("Failed to update reports: " + error.message);
    }
  };

  const handleExitBulkMode = () => {
    if (selectedReports.size > 0) {
      // Show confirmation if there are selected reports
      if (
        window.confirm(
          `You have ${selectedReports.size} reports selected. Are you sure you want to exit bulk edit mode?`
        )
      ) {
        setBulkEditMode(false);
        setSelectedReports(new Set());
      }
    } else {
      setBulkEditMode(false);
      setSelectedReports(new Set());
    }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + A to select all when in bulk edit mode
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "a" &&
        bulkEditMode
      ) {
        event.preventDefault();
        handleSelectAll();
      }
      // Escape to exit bulk edit mode
      if (event.key === "Escape" && bulkEditMode) {
        handleExitBulkMode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [bulkEditMode, selectedReports.size]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Penetration Test Reports
      </Typography>

      {/* Summary Statistics */}
      <Paper elevation={1} style={{ padding: 16, marginBottom: 20 }}>
        <Typography variant="h6" gutterBottom>
          Summary Statistics
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {reports.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Reports
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {reports.filter((r) => r.projectStatus === "Complete").length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Complete
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {
                  reports.filter(
                    (r) => r.projectStatus === "In Progress" || !r.projectStatus
                  ).length
                }
              </Typography>
              <Typography variant="body2" color="textSecondary">
                In Progress
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {
                  reports.filter((r) => r.projectStatus?.includes("Waiting"))
                    .length
                }
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Waiting
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Button
        variant="contained"
        style={{ marginBottom: 20 }}
        onClick={() => navigate("/new")}
      >
        Create New Report
      </Button>

      {/* Bulk Edit Toolbar */}
      {bulkEditMode && (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "primary.light",
            color: "primary.contrastText",
          }}
        >
          <Toolbar sx={{ px: 0 }}>
            <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
              <Checkbox
                checked={
                  selectedReports.size === filteredReports.length &&
                  filteredReports.length > 0
                }
                indeterminate={
                  selectedReports.size > 0 &&
                  selectedReports.size < filteredReports.length
                }
                onChange={handleSelectAll}
                icon={<CheckBoxOutlineBlankIcon />}
                checkedIcon={<CheckBoxIcon />}
                sx={{ color: "primary.contrastText" }}
              />
              <Typography variant="h6">
                {selectedReports.size} of {filteredReports.length} reports
                selected
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<EditIcon />}
                onClick={() => setBulkEditDialog(true)}
                disabled={selectedReports.size === 0}
              >
                Change Status
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleExitBulkMode}
              >
                Exit Bulk Edit
              </Button>
            </Box>
          </Toolbar>
        </Paper>
      )}

      {/* Bulk Edit Mode Toggle */}
      <Box display="flex" gap={2} alignItems="center" marginBottom={2}>
        <Button
          variant={bulkEditMode ? "contained" : "outlined"}
          color="primary"
          onClick={() => setBulkEditMode(!bulkEditMode)}
        >
          {bulkEditMode ? "Exit Bulk Edit" : "Bulk Edit Mode"}
        </Button>
        {bulkEditMode && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Click checkboxes to select reports for bulk editing • Use Ctrl+A
              to select all • Press Escape to exit
            </Typography>
            {selectedReports.size > 0 && (
              <Typography
                variant="body2"
                color="primary.main"
                fontWeight="bold"
              >
                {selectedReports.size} report
                {selectedReports.size !== 1 ? "s" : ""} selected
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <ReportsFilter onFilterChange={setFilters} />

      {/* Quick Filter Buttons */}
      <Box display="flex" gap={1} flexWrap="wrap" marginBottom={2}>
        <Button
          variant={filters.projectStatus === "All" ? "contained" : "outlined"}
          size="small"
          onClick={() =>
            setFilters((prev) => ({ ...prev, projectStatus: "All" }))
          }
        >
          All Projects
        </Button>
        <Button
          variant={
            filters.projectStatus === "Complete" ? "contained" : "outlined"
          }
          size="small"
          color="success"
          onClick={() =>
            setFilters((prev) => ({ ...prev, projectStatus: "Complete" }))
          }
        >
          Complete
        </Button>
        <Button
          variant={
            filters.projectStatus === "In Progress" ? "contained" : "outlined"
          }
          size="small"
          color="info"
          onClick={() =>
            setFilters((prev) => ({ ...prev, projectStatus: "In Progress" }))
          }
        >
          In Progress
        </Button>
        <Button
          variant={
            filters.projectStatus === "Completed with Exception"
              ? "contained"
              : "outlined"
          }
          size="small"
          color="warning"
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              projectStatus: "Completed with Exception",
            }))
          }
        >
          Completed with Exception
        </Button>
        <Button
          variant={
            filters.projectStatus === "Waiting for Fixes"
              ? "contained"
              : "outlined"
          }
          size="small"
          color="warning"
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              projectStatus: "Waiting for Fixes",
            }))
          }
        >
          Waiting for Fixes
        </Button>
        <Button
          variant={filters.openOnly ? "contained" : "outlined"}
          size="small"
          color="error"
          onClick={() =>
            setFilters((prev) => ({ ...prev, openOnly: !prev.openOnly }))
          }
        >
          {filters.openOnly ? "Show All" : "Open Findings Only"}
        </Button>
      </Box>

      <List>
        {filteredReports.map((report) => {
          const stats = getReportStats(report);
          const isSelected = selectedReports.has(report.id);

          return (
            <ListItem
              key={report.id}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                marginBottom: "8px",
                backgroundColor:
                  report.assessmentType === "Reassessment"
                    ? "#f5f5f5"
                    : isSelected
                    ? "#e3f2fd"
                    : "white",
              }}
            >
              {bulkEditMode && (
                <Checkbox
                  checked={isSelected}
                  onChange={() => handleSelectReport(report.id)}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ mr: 1 }}
                />
              )}

              <ListItemText
                onClick={() => {
                  if (bulkEditMode) {
                    handleSelectReport(report.id);
                  } else {
                    navigate(`/edit/${report.id}`);
                  }
                }}
                sx={{ cursor: "pointer" }}
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6">
                      {report.projectName} - v{report.version}
                    </Typography>
                    <Chip
                      label={report.assessmentType}
                      color={
                        report.assessmentType === "Initial"
                          ? "primary"
                          : "secondary"
                      }
                      size="small"
                    />
                    <Chip
                      label={report.projectStatus || "In Progress"}
                      color={getStatusColor(
                        report.projectStatus || "In Progress"
                      )}
                      size="small"
                      variant="outlined"
                    />
                    {report.projectStatus === "Completed with Exception" &&
                      report.fixByDate && (
                        <Chip
                          label={`Fix by: ${report.fixByDate}`}
                          color="warning"
                          size="small"
                          variant="filled"
                        />
                      )}
                    {stats.totalFindings > 0 && (
                      <Chip
                        label={`${stats.openFindings}/${stats.totalFindings} findings`}
                        color={stats.openFindings > 0 ? "warning" : "success"}
                        size="small"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      {report.startDate} - {report.endDate}
                    </Typography>
                    {report.assessmentType === "Reassessment" &&
                      report.parentAssessmentData && (
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          style={{ fontStyle: "italic" }}
                        >
                          Based on: {report.parentAssessmentData.projectName} (v
                          {report.parentAssessmentData.version})
                        </Typography>
                      )}
                  </Box>
                }
              />
            </ListItem>
          );
        })}
      </List>

      {filteredReports.length === 0 && (
        <Typography
          variant="body1"
          color="textSecondary"
          style={{ textAlign: "center", marginTop: 40 }}
        >
          No reports found matching the current filters.
        </Typography>
      )}

      {/* Bulk Edit Dialog */}
      <Dialog
        open={bulkEditDialog}
        onClose={() => setBulkEditDialog(false)}
        aria-labelledby="bulk-edit-dialog-title"
        aria-describedby="bulk-edit-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="bulk-edit-dialog-title">
          Bulk Edit Status - {selectedReports.size} Reports
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You are about to change the status for the following reports:
          </Typography>

          <Box sx={{ mb: 3, maxHeight: 200, overflowY: "auto" }}>
            {Array.from(selectedReports).map((reportId) => {
              const report = reports.find((r) => r.id === reportId);
              return report ? (
                <Box
                  key={reportId}
                  sx={{ mb: 1, p: 1, bgcolor: "grey.50", borderRadius: 1 }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    {report.projectName} - v{report.version}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Current Status: {report.projectStatus || "In Progress"}
                  </Typography>
                </Box>
              ) : null;
            })}
          </Box>

          <FormControl fullWidth>
            <InputLabel>New Project Status</InputLabel>
            <Select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              label="New Project Status"
            >
              {projectStatusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {bulkStatus === "Completed with Exception" && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Fix By Date"
                value={bulkFixByDate}
                onChange={(e) => setBulkFixByDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Select the date by which the exceptions should be fixed"
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkEditDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleBulkStatusChange}
            color="primary"
            variant="contained"
            disabled={
              !bulkStatus ||
              (bulkStatus === "Completed with Exception" && !bulkFixByDate)
            }
            autoFocus
          >
            Update {selectedReports.size} Reports
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Home;
