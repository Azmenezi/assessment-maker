import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import useReportsStore from "../store/useReportsStore";
import useTemplatesStore from "../store/useTemplatesStore";
import { ToastContext } from "../App";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function NewReport() {
  const toast = useContext(ToastContext);
  const createReport = useReportsStore((state) => state.createReport);
  const { assessorName } = useTemplatesStore();

  const [projectName, setProjectName] = useState("");
  const [version, setVersion] = useState("1.0");
  const [assessmentType, setAssessmentType] = useState("Initial");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [localAssessorName, setLocalAssessorName] = useState(assessorName);
  const [platform, setPlatform] = useState("Web Application");
  const [urls, setUrls] = useState("");
  const [credentials, setCredentials] = useState("N/A");

  // New fields
  const [ticketNumber, setTicketNumber] = useState("");
  const [buildVersions, setBuildVersions] = useState("");
  const [projectStatus, setProjectStatus] = useState("In Progress");
  const [requestedBy, setRequestedBy] = useState("Digital Factory Division");

  // Enhanced endpoint management
  const [endpointTabValue, setEndpointTabValue] = useState(0);
  const [endpoints, setEndpoints] = useState([]);
  const [bulkEndpoints, setBulkEndpoints] = useState("");
  const [newEndpoint, setNewEndpoint] = useState({ method: "GET", path: "" });

  const navigate = useNavigate();

  const httpMethods = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "HEAD",
    "OPTIONS",
  ];

  const projectStatusOptions = [
    "In Progress",
    "Complete",
    "Waiting for Fixes",
    "Waiting for Client Response",
    "On Hold",
    "Cancelled",
    "Ready for Review",
    "Under Review",
  ];

  const handleAddEndpoint = () => {
    if (newEndpoint.path.trim()) {
      const endpoint = `${newEndpoint.method} ${newEndpoint.path.trim()}`;
      setEndpoints([...endpoints, endpoint]);
      setNewEndpoint({ method: "GET", path: "" });
    }
  };

  const handleRemoveEndpoint = (index) => {
    const updated = [...endpoints];
    updated.splice(index, 1);
    setEndpoints(updated);
  };

  const handleBulkAdd = () => {
    if (bulkEndpoints.trim()) {
      const lines = bulkEndpoints.split("\n").filter((line) => line.trim());
      const newEndpoints = lines.map((line) => line.trim());
      setEndpoints([...endpoints, ...newEndpoints]);
      setBulkEndpoints("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation logic
    const missingFields = [];
    if (!projectName.trim()) missingFields.push("Project Name");
    if (!version.trim()) missingFields.push("Version");
    if (!startDate) missingFields.push("Start Date");
    if (!endDate) missingFields.push("End Date");
    if (!localAssessorName.trim()) missingFields.push("Assessor Name");
    if (!platform.trim()) missingFields.push("Platform");
    if (!requestedBy.trim()) missingFields.push("Requested By");

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in the following required fields: ${missingFields.join(
          ", "
        )}`
      );
      return;
    }

    // Date validation
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start Date cannot be after End Date");
      return;
    }

    try {
      const newReportId = await createReport({
        projectName,
        version,
        assessmentType,
        startDate,
        endDate,
        assessorName: localAssessorName,
        executiveSummary: "",
        scope: "",
        methodology: "",
        detailedFindings: [],
        conclusion: "",
        logo: null,
        platform,
        urls: "",
        credentials: "",
        ticketNumber,
        buildVersions,
        projectStatus,
        requestedBy,
      });

      toast.success("Report created successfully!");
      navigate(`/edit/${newReportId}`);
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error("Failed to create report: " + error.message);
    }
  };

  return (
    <Container style={{ paddingBottom: 40 }}>
      <Typography marginTop={4} variant="h5" gutterBottom>
        New Report
      </Typography>

      <Box display="flex" gap={2} mb={2}>
        <TextField
          type="date"
          label="Start Date *"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ flex: 1 }}
          required
        />
        <TextField
          type="date"
          label="End Date *"
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ flex: 1 }}
          required
        />
      </Box>

      <FormControl fullWidth margin="normal">
        <TextField
          label="Project Name *"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter project name..."
          required
        />
      </FormControl>

      <Box display="flex" gap={2}>
        <TextField
          label="Version *"
          margin="normal"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          style={{ flex: 1 }}
          required
        />
        <TextField
          select
          label="Assessment Type"
          margin="normal"
          value={assessmentType}
          onChange={(e) => setAssessmentType(e.target.value)}
          style={{ flex: 1 }}
        >
          <MenuItem value="Initial">Initial</MenuItem>
          <MenuItem value="Reassessment">Reassessment</MenuItem>
        </TextField>
        <TextField
          select
          label="Project Status"
          margin="normal"
          value={projectStatus}
          onChange={(e) => setProjectStatus(e.target.value)}
          style={{ flex: 1 }}
        >
          {projectStatusOptions.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TextField
        label="Assessor Name *"
        fullWidth
        margin="normal"
        value={localAssessorName}
        onChange={(e) => setLocalAssessorName(e.target.value)}
        required
      />

      <TextField
        label="Platform *"
        fullWidth
        margin="normal"
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        placeholder="e.g., Web Application, Mobile App, API, etc."
        required
      />

      {/* Project Reference Fields */}
      <Box mt={2} mb={2}>
        <Typography variant="h6" gutterBottom>
          Project Reference
        </Typography>
        <Box display="flex" gap={2} mb={2}>
          <TextField
            label="Ticket Number"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            placeholder="e.g., JIRA-123, INC-456"
            style={{ flex: 1 }}
          />
          <TextField
            label="Build Versions (Mobile Apps)"
            value={buildVersions}
            onChange={(e) => setBuildVersions(e.target.value)}
            placeholder="e.g., iOS: 1.2.3, Android: 1.2.4"
            style={{ flex: 1 }}
          />
        </Box>
        <TextField
          label="Requested By *"
          fullWidth
          value={requestedBy}
          onChange={(e) => setRequestedBy(e.target.value)}
          placeholder="Department or division requesting the assessment"
          required
        />
      </Box>

      {/* Enhanced Endpoint Management */}
      <Paper
        elevation={1}
        style={{ padding: 16, marginTop: 16, marginBottom: 16 }}
      >
        <Typography variant="h6" gutterBottom>
          Endpoints/URLs
        </Typography>

        <Tabs
          value={endpointTabValue}
          onChange={(e, v) => setEndpointTabValue(v)}
        >
          <Tab label="Individual Entry" />
          <Tab label="Bulk Entry" />
          <Tab label="Simple URLs" />
        </Tabs>

        <TabPanel value={endpointTabValue} index={0}>
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <FormControl style={{ minWidth: 120 }}>
              <InputLabel>Method</InputLabel>
              <Select
                value={newEndpoint.method}
                onChange={(e) =>
                  setNewEndpoint({ ...newEndpoint, method: e.target.value })
                }
              >
                {httpMethods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Endpoint Path"
              value={newEndpoint.path}
              onChange={(e) =>
                setNewEndpoint({ ...newEndpoint, path: e.target.value })
              }
              placeholder="/public/anything/something"
              style={{ flex: 1 }}
            />
            <IconButton onClick={handleAddEndpoint} color="primary">
              <AddIcon />
            </IconButton>
          </Box>
        </TabPanel>

        <TabPanel value={endpointTabValue} index={1}>
          <TextField
            label="Bulk Endpoints"
            fullWidth
            multiline
            rows={6}
            value={bulkEndpoints}
            onChange={(e) => setBulkEndpoints(e.target.value)}
            placeholder={`POST /public/auth/login
GET /public/users/profile
DELETE /public/users/123
PUT /public/accounts/settings
GET /api/v1/transactions`}
            helperText="Enter one endpoint per line. Format: METHOD /path"
          />
          <Button
            variant="outlined"
            onClick={handleBulkAdd}
            style={{ marginTop: 8 }}
            disabled={!bulkEndpoints.trim()}
          >
            Add All Endpoints
          </Button>
        </TabPanel>

        <TabPanel value={endpointTabValue} index={2}>
          <TextField
            label="Simple URLs/IP Addresses"
            fullWidth
            multiline
            rows={4}
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder={`https://example.com
192.168.1.100
https://api.example.com/v1`}
            helperText="Traditional URL/IP entry format"
          />
        </TabPanel>

        {/* Display current endpoints */}
        {endpoints.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Current Endpoints ({endpoints.length}):
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {endpoints.map((endpoint, index) => (
                <Chip
                  key={index}
                  label={endpoint}
                  onDelete={() => handleRemoveEndpoint(index)}
                  deleteIcon={<DeleteIcon />}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      <TextField
        label="Credentials"
        fullWidth
        margin="normal"
        value={credentials}
        onChange={(e) => setCredentials(e.target.value)}
      />

      <Box mt={3}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          size="large"
        >
          Create & Edit Report
        </Button>
      </Box>
    </Container>
  );
}

export default NewReport;
