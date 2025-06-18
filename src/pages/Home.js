import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
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
} from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import useReportsStore from "../store/useReportsStore";

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
  const navigate = useNavigate();

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
          return (
            <ListItem
              key={report.id}
              onClick={() => navigate(`/edit/${report.id}`)}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                marginBottom: "8px",
                backgroundColor:
                  report.assessmentType === "Reassessment"
                    ? "#f5f5f5"
                    : "white",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "#f0f0f0",
                },
              }}
            >
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6" component="span">
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
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      component="div"
                    >
                      {report.startDate} - {report.endDate}
                    </Typography>
                    {report.assessmentType === "Reassessment" &&
                      report.parentAssessmentData && (
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          component="div"
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
    </Container>
  );
}

export default Home;
