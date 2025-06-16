import {
  Assessment,
  BugReport,
  Security,
  TrendingUp,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import React, { useMemo, useState } from "react";
import useReportsStore from "../store/useReportsStore";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function AnalyticsPage() {
  const reports = useReportsStore((state) => state.reports);
  const [tabValue, setTabValue] = useState(0);
  const [timeFilter, setTimeFilter] = useState("all");

  // Filter reports by time
  const filteredReports = useMemo(() => {
    if (timeFilter === "all") return reports;

    const now = new Date();
    const filterDate = new Date();

    switch (timeFilter) {
      case "30days":
        filterDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        filterDate.setDate(now.getDate() - 90);
        break;
      case "1year":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return reports;
    }

    return reports.filter((report) => {
      const reportDate = new Date(report.endDate || report.startDate);
      return reportDate >= filterDate;
    });
  }, [reports, timeFilter]);

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const totalReports = filteredReports.length;
    const totalFindings = filteredReports.reduce(
      (sum, report) => sum + (report.detailedFindings?.length || 0),
      0
    );
    const openFindings = filteredReports.reduce(
      (sum, report) =>
        sum +
        (report.detailedFindings?.filter((f) => f.status === "OPEN").length ||
          0),
      0
    );
    const closedFindings = totalFindings - openFindings;

    // Findings by severity
    const severityCounts = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
      Informational: 0,
    };

    const openSeverityCounts = { ...severityCounts };
    const findingTitles = {};
    const categories = {};
    const projectStats = {};
    const assessmentTypes = { Initial: 0, Reassessment: 0 };
    const projectStatuses = {};

    filteredReports.forEach((report) => {
      // Assessment types
      assessmentTypes[report.assessmentType] =
        (assessmentTypes[report.assessmentType] || 0) + 1;

      // Project statuses
      const status = report.projectStatus || "Unknown";
      projectStatuses[status] = (projectStatuses[status] || 0) + 1;

      // Project-level stats
      if (!projectStats[report.projectName]) {
        projectStats[report.projectName] = {
          reports: 0,
          findings: 0,
          openFindings: 0,
          lastAssessment: report.endDate || report.startDate,
        };
      }
      projectStats[report.projectName].reports++;
      projectStats[report.projectName].findings +=
        report.detailedFindings?.length || 0;
      projectStats[report.projectName].openFindings +=
        report.detailedFindings?.filter((f) => f.status === "OPEN").length || 0;

      // Update last assessment date
      const currentDate = report.endDate || report.startDate;
      if (currentDate > projectStats[report.projectName].lastAssessment) {
        projectStats[report.projectName].lastAssessment = currentDate;
      }

      report.detailedFindings?.forEach((finding) => {
        // Severity counts
        severityCounts[finding.severity] =
          (severityCounts[finding.severity] || 0) + 1;
        if (finding.status === "OPEN") {
          openSeverityCounts[finding.severity] =
            (openSeverityCounts[finding.severity] || 0) + 1;
        }

        // Finding titles
        findingTitles[finding.title] = (findingTitles[finding.title] || 0) + 1;

        // Categories
        if (finding.category) {
          categories[finding.category] =
            (categories[finding.category] || 0) + 1;
        }
      });
    });

    // Sort findings by frequency
    const sortedFindings = Object.entries(findingTitles)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    // Sort categories by frequency
    const sortedCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    // Sort projects by risk (open findings)
    const sortedProjects = Object.entries(projectStats)
      .sort((a, b) => b[1].openFindings - a[1].openFindings)
      .slice(0, 10);

    return {
      totalReports,
      totalFindings,
      openFindings,
      closedFindings,
      severityCounts,
      openSeverityCounts,
      sortedFindings,
      sortedCategories,
      sortedProjects,
      assessmentTypes,
      projectStatuses,
      averageFindingsPerReport:
        totalReports > 0 ? (totalFindings / totalReports).toFixed(1) : 0,
      openFindingsPercentage:
        totalFindings > 0
          ? ((openFindings / totalFindings) * 100).toFixed(1)
          : 0,
    };
  }, [filteredReports]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "error";
      case "High":
        return "error";
      case "Medium":
        return "warning";
      case "Low":
        return "info";
      case "Informational":
        return "default";
      default:
        return "default";
    }
  };

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
      default:
        return "default";
    }
  };

  return (
    <Container maxWidth="xl">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" gutterBottom>
          Security Analytics Dashboard
        </Typography>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            label="Time Period"
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
            <MenuItem value="1year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {analytics.totalReports === 0 ? (
        <Alert severity="info">
          No reports found for the selected time period. Create some reports to
          see analytics.
        </Alert>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Assessment color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Reports
                      </Typography>
                      <Typography variant="h4">
                        {analytics.totalReports}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <BugReport color="error" sx={{ mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Findings
                      </Typography>
                      <Typography variant="h4">
                        {analytics.totalFindings}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Avg: {analytics.averageFindingsPerReport} per report
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Security color="warning" sx={{ mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Open Findings
                      </Typography>
                      <Typography variant="h4" color="error">
                        {analytics.openFindings}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {analytics.openFindingsPercentage}% of total
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <TrendingUp color="success" sx={{ mr: 2 }} />
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Resolved Findings
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {analytics.closedFindings}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {(
                          100 - parseFloat(analytics.openFindingsPercentage)
                        ).toFixed(1)}
                        % resolved
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            sx={{ mb: 3 }}
          >
            <Tab label="Findings Analysis" />
            <Tab label="Project Overview" />
            <Tab label="Severity Breakdown" />
            <Tab label="Categories & Trends" />
          </Tabs>

          {/* Findings Analysis Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Most Common Findings
                  </Typography>
                  {analytics.sortedFindings.length === 0 ? (
                    <Typography color="textSecondary">
                      No findings data available.
                    </Typography>
                  ) : (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Rank</TableCell>
                          <TableCell>Finding Title</TableCell>
                          <TableCell align="right">Occurrences</TableCell>
                          <TableCell align="right">% of Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics.sortedFindings.map(
                          ([title, count], index) => (
                            <TableRow key={title}>
                              <TableCell>#{index + 1}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {title}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={count}
                                  size="small"
                                  color="primary"
                                />
                              </TableCell>
                              <TableCell align="right">
                                {(
                                  (count / analytics.totalFindings) *
                                  100
                                ).toFixed(1)}
                                %
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Assessment Types
                  </Typography>
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Initial Assessments</Typography>
                      <Typography fontWeight="bold">
                        {analytics.assessmentTypes.Initial}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (analytics.assessmentTypes.Initial /
                          analytics.totalReports) *
                        100
                      }
                      sx={{ mb: 2 }}
                    />

                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Reassessments</Typography>
                      <Typography fontWeight="bold">
                        {analytics.assessmentTypes.Reassessment || 0}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        ((analytics.assessmentTypes.Reassessment || 0) /
                          analytics.totalReports) *
                        100
                      }
                      color="secondary"
                    />
                  </Box>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Project Statuses
                  </Typography>
                  {Object.entries(analytics.projectStatuses).map(
                    ([status, count]) => (
                      <Box
                        key={status}
                        display="flex"
                        justifyContent="space-between"
                        mb={1}
                      >
                        <Chip
                          label={status}
                          size="small"
                          color={getStatusColor(status)}
                        />
                        <Typography>{count}</Typography>
                      </Box>
                    )
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Project Overview Tab */}
          <TabPanel value={tabValue} index={1}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Projects by Risk Level (Open Findings)
              </Typography>
              {analytics.sortedProjects.length === 0 ? (
                <Typography color="textSecondary">
                  No project data available.
                </Typography>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Project Name</TableCell>
                      <TableCell align="right">Reports</TableCell>
                      <TableCell align="right">Total Findings</TableCell>
                      <TableCell align="right">Open Findings</TableCell>
                      <TableCell align="right">Risk Level</TableCell>
                      <TableCell>Last Assessment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.sortedProjects.map(([projectName, stats]) => {
                      const riskLevel =
                        stats.openFindings >= 10
                          ? "High"
                          : stats.openFindings >= 5
                          ? "Medium"
                          : stats.openFindings > 0
                          ? "Low"
                          : "None";
                      const riskColor =
                        riskLevel === "High"
                          ? "error"
                          : riskLevel === "Medium"
                          ? "warning"
                          : riskLevel === "Low"
                          ? "info"
                          : "success";

                      return (
                        <TableRow key={projectName}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {projectName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{stats.reports}</TableCell>
                          <TableCell align="right">{stats.findings}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={stats.openFindings}
                              size="small"
                              color={
                                stats.openFindings > 0 ? "error" : "success"
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={riskLevel}
                              size="small"
                              color={riskColor}
                            />
                          </TableCell>
                          <TableCell>{stats.lastAssessment}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </TabPanel>

          {/* Severity Breakdown Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    All Findings by Severity
                  </Typography>
                  {Object.entries(analytics.severityCounts).map(
                    ([severity, count]) => (
                      <Box key={severity} mb={2}>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          mb={1}
                        >
                          <Chip
                            label={severity}
                            color={getSeverityColor(severity)}
                            size="small"
                          />
                          <Typography fontWeight="bold">{count}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={
                            analytics.totalFindings > 0
                              ? (count / analytics.totalFindings) * 100
                              : 0
                          }
                          color={getSeverityColor(severity)}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {analytics.totalFindings > 0
                            ? ((count / analytics.totalFindings) * 100).toFixed(
                                1
                              )
                            : 0}
                          % of total findings
                        </Typography>
                      </Box>
                    )
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Open Findings by Severity
                  </Typography>
                  {Object.entries(analytics.openSeverityCounts).map(
                    ([severity, count]) => (
                      <Box key={severity} mb={2}>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          mb={1}
                        >
                          <Chip
                            label={severity}
                            color={getSeverityColor(severity)}
                            size="small"
                          />
                          <Typography fontWeight="bold" color="error">
                            {count}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={
                            analytics.openFindings > 0
                              ? (count / analytics.openFindings) * 100
                              : 0
                          }
                          color={getSeverityColor(severity)}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {analytics.openFindings > 0
                            ? ((count / analytics.openFindings) * 100).toFixed(
                                1
                              )
                            : 0}
                          % of open findings
                        </Typography>
                      </Box>
                    )
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Categories & Trends Tab */}
          <TabPanel value={tabValue} index={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Most Common Vulnerability Categories
              </Typography>
              {analytics.sortedCategories.length === 0 ? (
                <Typography color="textSecondary">
                  No category data available.
                </Typography>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Findings</TableCell>
                      <TableCell align="right">% of Total</TableCell>
                      <TableCell>Distribution</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.sortedCategories.map(
                      ([category, count], index) => (
                        <TableRow key={category}>
                          <TableCell>#{index + 1}</TableCell>
                          <TableCell>
                            <Chip
                              label={category}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold">{count}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            {((count / analytics.totalFindings) * 100).toFixed(
                              1
                            )}
                            %
                          </TableCell>
                          <TableCell>
                            <Box width="100px">
                              <LinearProgress
                                variant="determinate"
                                value={(count / analytics.totalFindings) * 100}
                                color="primary"
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </TabPanel>
        </>
      )}
    </Container>
  );
}

export default AnalyticsPage;
