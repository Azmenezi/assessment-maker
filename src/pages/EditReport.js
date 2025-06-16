import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Packer } from "docx";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useFindingsLibraryStore from "../store/useFindingsLibraryStore";
import useReportsStore from "../store/useReportsStore";
import useSettingsStore from "../store/useSettingsStore";
import { exportReportToPDF } from "../utils/exportPDF";
import { exportReportToWord } from "../utils/exportWord";
import { ToastContext } from "../App";
import { ConfirmDialog } from "../components/ConfirmDialog";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function EndpointTabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

// Utility function to convert base64 image to binary
function base64ToBinary(base64) {
  // Remove prefix like "data:image/png;base64,"
  const base64Data = base64.split(",")[1];
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function EditReport() {
  const toast = useContext(ToastContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const { getReportById, updateReport, createReassessment } = useReportsStore();
  const { defaultLogo, exportPath } = useSettingsStore();
  const report = getReportById(id);

  const { findings: libraryFindings, addFindingToLibrary } =
    useFindingsLibraryStore();

  const [tabValue, setTabValue] = useState(0);

  // Enhanced endpoint management
  const [endpointTabValue, setEndpointTabValue] = useState(0);
  const [endpoints, setEndpoints] = useState([]);
  const [bulkEndpoints, setBulkEndpoints] = useState("");
  const [newEndpoint, setNewEndpoint] = useState({ method: "GET", path: "" });

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

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedLibIndex, setSelectedLibIndex] = useState("");

  // Finding editing states
  const [editingFinding, setEditingFinding] = useState(null);
  const [editingFindingIndex, setEditingFindingIndex] = useState(-1);

  const handleOpenLibrary = () => setLibraryOpen(true);
  const handleCloseLibrary = () => setLibraryOpen(false);

  const applyLibraryFinding = () => {
    if (selectedLibIndex !== "") {
      const lf = libraryFindings[selectedLibIndex];
      setNewFinding({
        ...lf,
        pocImages: [], // pocImages empty by default or copy if you want
        affectedEndpoints: lf.affectedEndpoints || [], // Preserve affected endpoints from library
      });
      setLibraryOpen(false);
    }
  };

  // Local states for report details
  const [projectName, setProjectName] = useState("");
  const [version, setVersion] = useState("");
  const [assessmentType, setAssessmentType] = useState("Initial");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assessorName, setAssessorName] = useState("");
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [scope, setScope] = useState("");
  const [methodology, setMethodology] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [platform, setPlatform] = useState("");
  const [urls, setUrls] = useState("");
  const [credentials, setCredentials] = useState("");
  const [detailedFindings, setDetailedFindings] = useState([]);

  // New fields
  const [ticketNumber, setTicketNumber] = useState("");
  const [buildVersions, setBuildVersions] = useState("");
  const [projectStatus, setProjectStatus] = useState("In Progress");
  const [requestedBy, setRequestedBy] = useState("Digital Factory Division");

  // State for selected finding details dialog
  const [selectedFinding, setSelectedFinding] = useState(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    severity: "warning",
  });

  useEffect(() => {
    if (report) {
      setProjectName(report.projectName);
      setVersion(report.version);
      setAssessmentType(report.assessmentType);
      setStartDate(report.startDate);
      setEndDate(report.endDate);
      setAssessorName(report.assessorName);
      setExecutiveSummary(report.executiveSummary);
      setScope(report.scope);
      setMethodology(report.methodology);
      setDetailedFindings(report.detailedFindings || []);
      setConclusion(report.conclusion);
      setPlatform(report.platform || "");
      setUrls(report.urls || "");
      setCredentials(report.credentials || "");
      setTicketNumber(report.ticketNumber || "");
      setBuildVersions(report.buildVersions || "");
      setProjectStatus(report.projectStatus || "In Progress");
      setRequestedBy(report.requestedBy || "Digital Factory Division");

      // Parse existing URLs into endpoints if they look like API endpoints
      if (report.urls) {
        const urlLines = report.urls.split("\n").filter((line) => line.trim());
        const parsedEndpoints = [];
        const remainingUrls = [];

        urlLines.forEach((line) => {
          const trimmedLine = line.trim();
          // Check if line looks like an API endpoint (starts with HTTP method)
          if (
            /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+/.test(trimmedLine)
          ) {
            parsedEndpoints.push(trimmedLine);
          } else {
            remainingUrls.push(trimmedLine);
          }
        });

        setEndpoints(parsedEndpoints);
        setUrls(remainingUrls.join("\n"));
      }
    }
  }, [report]);

  const handleStatusToggle = (index) => {
    const updatedFindings = [...detailedFindings];
    updatedFindings[index].status =
      updatedFindings[index].status === "OPEN" ? "CLOSED" : "OPEN";
    setDetailedFindings(updatedFindings);
    updateReport(id, { detailedFindings: updatedFindings });
  };

  const handleSave = () => {
    const finalUrls =
      endpoints.length > 0
        ? [
            ...endpoints,
            ...urls.split("\n").filter((line) => line.trim()),
          ].join("\n")
        : urls;

    updateReport(id, {
      projectName,
      version,
      assessmentType,
      startDate,
      endDate,
      assessorName,
      executiveSummary,
      scope,
      methodology,
      detailedFindings,
      conclusion,
      platform,
      urls: finalUrls,
      credentials,
      ticketNumber,
      buildVersions,
      projectStatus,
      requestedBy,
    });
    // Add new findings to library if not duplicate
    for (const finding of detailedFindings) {
      const exists = libraryFindings.some(
        (lf) => lf.title === finding.title && lf.severity === finding.severity
      );
      if (!exists) {
        addFindingToLibrary({
          ...finding,
          status: "OPEN",
          pocImages: [],
          affectedEndpoints: finding.affectedEndpoints || [],
        });
      }
    }

    toast.success("Report saved!");
  };

  const handleExportPDF = () => {
    const finalUrls =
      endpoints.length > 0
        ? [
            ...endpoints,
            ...urls.split("\n").filter((line) => line.trim()),
          ].join("\n")
        : urls;

    exportReportToPDF(
      {
        ...report,
        projectName,
        version,
        assessmentType,
        startDate,
        endDate,
        assessorName,
        executiveSummary,
        scope,
        methodology,
        detailedFindings,
        conclusion,
        logo: report.logo,
        urls: finalUrls,
        requestedBy,
      },
      { defaultLogo }
    );
  };

  const handleExportWord = () => {
    const finalUrls =
      endpoints.length > 0
        ? [
            ...endpoints,
            ...urls.split("\n").filter((line) => line.trim()),
          ].join("\n")
        : urls;

    exportReportToWord(
      {
        ...report,
        projectName,
        version,
        assessmentType,
        startDate,
        endDate,
        assessorName,
        executiveSummary,
        scope,
        methodology,
        detailedFindings,
        conclusion,
        logo: report.logo,
        urls: finalUrls,
        requestedBy,
      },
      { defaultLogo }
    );
  };

  const handleAddPoCImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      setNewFinding((prev) => ({
        ...prev,
        pocImages: [...prev.pocImages, { name: file.name, data: base64 }],
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddPoCImageToEdit = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      setEditingFinding((prev) => ({
        ...prev,
        pocImages: [
          ...(prev.pocImages || []),
          { name: file.name, data: base64 },
        ],
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const severities = ["Critical", "High", "Medium", "Low", "Informational"];
  const [newFinding, setNewFinding] = useState({
    title: "",
    category: "",
    severity: "Low",
    description: "",
    impact: "",
    mitigation: "",
    pocImages: [],
    status: "OPEN",
    affectedEndpoints: [],
  });

  const addFinding = () => {
    setDetailedFindings([...detailedFindings, { ...newFinding }]);
    setNewFinding({
      title: "",
      category: "",
      severity: "Low",
      description: "",
      impact: "",
      mitigation: "",
      pocImages: [],
      status: "OPEN",
      affectedEndpoints: [],
    });
  };

  const deleteFinding = (index) => {
    const updated = [...detailedFindings];
    updated.splice(index, 1);
    setDetailedFindings(updated);
  };

  const openEditFinding = (finding, index) => {
    setEditingFinding({ ...finding });
    setEditingFindingIndex(index);
  };

  const saveEditedFinding = () => {
    const updatedFindings = [...detailedFindings];
    updatedFindings[editingFindingIndex] = { ...editingFinding };
    setDetailedFindings(updatedFindings);
    setEditingFinding(null);
    setEditingFindingIndex(-1);
  };

  const handleCreateReassessment = () => {
    setConfirmDialog({
      open: true,
      title: "Create Reassessment",
      message: "Create a new reassessment based on this assessment?",
      severity: "info",
      onConfirm: () => {
        const finalUrls =
          endpoints.length > 0
            ? [
                ...endpoints,
                ...urls.split("\n").filter((line) => line.trim()),
              ].join("\n")
            : urls;

        const newReassessmentId = createReassessment(id, {
          projectName: projectName,
          version: "1.0",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          assessorName,
          executiveSummary: "",
          scope,
          methodology,
          detailedFindings: detailedFindings.map((f) => ({
            ...f,
            status: "OPEN",
          })), // Copy findings but reset status
          conclusion: "",
          platform,
          urls: finalUrls,
          credentials,
          ticketNumber: ticketNumber,
          buildVersions,
          projectStatus: "In Progress", // Reset status for reassessment
          requestedBy,
        });
        navigate(`/edit/${newReassessmentId}`);
      },
    });
  };

  const handleExportZip = async () => {
    if (!report) {
      toast.error("No report to export.");
      return;
    }

    const finalUrls =
      endpoints.length > 0
        ? [
            ...endpoints,
            ...urls.split("\n").filter((line) => line.trim()),
          ].join("\n")
        : urls;

    const pdfDocGenerator = exportReportToPDF(
      {
        ...report,
        projectName,
        version,
        assessmentType,
        startDate,
        endDate,
        assessorName,
        executiveSummary,
        scope,
        methodology,
        detailedFindings,
        conclusion,
        logo: report.logo,
        urls: finalUrls,
        requestedBy,
      },
      { defaultLogo },
      { returnDoc: true } // get pdfDocGenerator
    );

    const pdfBlob = await new Promise((resolve) => {
      pdfDocGenerator.getBlob((blob) => resolve(blob));
    });

    const doc = await exportReportToWord(
      {
        ...report,
        projectName,
        version,
        assessmentType,
        startDate,
        endDate,
        assessorName,
        executiveSummary,
        scope,
        methodology,
        detailedFindings,
        conclusion,
        logo: report.logo,
        urls: finalUrls,
        requestedBy,
      },
      { defaultLogo },
      { returnDoc: true } // get Document object
    );
    const wordBlob = await Packer.toBlob(doc);

    // Collect images
    const images = [];
    detailedFindings.forEach((f, idx) => {
      if (f.pocImages && f.pocImages.length > 0) {
        f.pocImages.forEach((img, iidx) => {
          img.data &&
            images.push({
              name: `finding_${idx + 1}_${f.title}.png`,
              data: img.data,
            });
        });
      }
    });

    const zip = new JSZip();
    const folderName = projectName.replace(/\s+/g, "_");
    const folder = zip.folder(folderName);

    folder.file(
      `${folderName}_${
        assessmentType === "Initial" ? "assessment" : "reassessment"
      }.pdf`,
      pdfBlob
    );
    folder.file(
      `${folderName}_${
        assessmentType === "Initial" ? "assessment" : "reassessment"
      }.docx`,
      wordBlob
    );

    const imagesFolder = folder.folder("findingsImages");
    images.forEach((img) => {
      const binaryData = base64ToBinary(img.data);
      imagesFolder.file(img.name, binaryData);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Save to selected path or default
    if (exportPath && window.electronAPI) {
      // Use electron API to save to specific path
      const pdfBuffer = await pdfBlob.arrayBuffer();
      const wordBuffer = await wordBlob.arrayBuffer();
      await window.electronAPI.exportProjectFolder({
        projectName: folderName,
        pdfBuffer: new Uint8Array(pdfBuffer),
        wordBuffer: new Uint8Array(wordBuffer),
        findings: detailedFindings,
        exportPath: exportPath,
      });
      toast.success(`Export completed to: ${exportPath}`);
    } else {
      // Default browser download
      saveAs(
        zipBlob,
        `${folderName}_${
          assessmentType === "Initial" ? "Assessment" : "Reassessment"
        }.zip`
      );

      // Show export path info if set
      if (exportPath) {
        toast.info(
          `ZIP file downloaded to your browser's default download folder.\nConfigured export path: ${exportPath}\n\nNote: In web version, files are downloaded to browser's default location.`,
          6000
        );
      } else {
        toast.success("ZIP file downloaded successfully!");
      }
    }
  };

  return (
    <Container style={{ paddingBottom: 40 }}>
      {report ? (
        <>
          <Typography variant="h4" gutterBottom>
            Editing Report: {projectName} (v{version})
          </Typography>

          {/* Show parent assessment info for reassessments */}
          {report.assessmentType === "Reassessment" &&
            report.parentAssessmentData && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Original Assessment:</strong>{" "}
                  {report.parentAssessmentData.projectName}
                  (v{report.parentAssessmentData.version}) -
                  {report.parentAssessmentData.startDate} to{" "}
                  {report.parentAssessmentData.endDate}
                </Typography>
                <Typography variant="body2">
                  <strong>Original Findings:</strong>{" "}
                  {report.parentAssessmentData.detailedFindings?.length || 0}{" "}
                  findings
                </Typography>
              </Alert>
            )}

          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleChangeTab}>
              <Tab label="Details" />
              <Tab label="Findings" />
              {report.assessmentType === "Reassessment" && (
                <Tab label="Original Assessment" />
              )}
            </Tabs>
          </Box>

          {/* Details Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box display="flex" gap={2} mb={2}>
              <TextField
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ flex: 1 }}
              />
              <TextField
                type="date"
                label="End Date (Finish Date)"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ flex: 1 }}
              />
            </Box>

            <TextField
              label="Project Name"
              fullWidth
              margin="normal"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />

            <Box display="flex" gap={2}>
              <TextField
                label="Version"
                margin="normal"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                style={{ flex: 1 }}
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
              label="Assessor Name"
              fullWidth
              margin="normal"
              value={assessorName}
              onChange={(e) => setAssessorName(e.target.value)}
            />

            <TextField
              label="Platform"
              fullWidth
              margin="normal"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="e.g., Web Application, Mobile App, API, etc."
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
                label="Requested By"
                fullWidth
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                placeholder="Department or division requesting the assessment"
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

              <EndpointTabPanel value={endpointTabValue} index={0}>
                <Box display="flex" gap={2} alignItems="center" mb={2}>
                  <FormControl style={{ minWidth: 120 }}>
                    <InputLabel>Method</InputLabel>
                    <Select
                      value={newEndpoint.method}
                      onChange={(e) =>
                        setNewEndpoint({
                          ...newEndpoint,
                          method: e.target.value,
                        })
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
              </EndpointTabPanel>

              <EndpointTabPanel value={endpointTabValue} index={1}>
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
              </EndpointTabPanel>

              <EndpointTabPanel value={endpointTabValue} index={2}>
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
              </EndpointTabPanel>

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
          </TabPanel>

          {/* Findings Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h5" style={{ marginTop: "20px" }}>
              Findings
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detailedFindings.map((f, index) => (
                  <TableRow
                    key={index}
                    hover
                    onClick={() => setSelectedFinding(f)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{f.title}</TableCell>
                    <TableCell>{f.severity}</TableCell>
                    <TableCell>
                      <Switch
                        checked={f.status === "OPEN"}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusToggle(index);
                        }}
                        color="primary"
                      />
                      {f.status}
                    </TableCell>
                    <TableCell
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <IconButton onClick={() => openEditFinding(f, index)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => deleteFinding(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box mt={2}>
              <Typography variant="h6">Add New Finding</Typography>
              <Button
                variant="outlined"
                onClick={handleOpenLibrary}
                style={{ marginBottom: "10px" }}
              >
                Add From Library
              </Button>

              <Dialog open={libraryOpen} onClose={handleCloseLibrary}>
                <DialogTitle>Select a Finding from the Library</DialogTitle>
                <DialogContent>
                  <Select
                    fullWidth
                    value={selectedLibIndex}
                    onChange={(e) => setSelectedLibIndex(e.target.value)}
                  >
                    <MenuItem value="">--Select--</MenuItem>
                    {libraryFindings.map((lf, i) => (
                      <MenuItem key={i} value={i}>
                        {lf.title} ({lf.severity})
                      </MenuItem>
                    ))}
                  </Select>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={applyLibraryFinding}
                    disabled={selectedLibIndex === ""}
                  >
                    Apply
                  </Button>
                  <Button onClick={handleCloseLibrary}>Cancel</Button>
                </DialogActions>
              </Dialog>
              <TextField
                label="Title"
                fullWidth
                margin="normal"
                value={newFinding.title}
                onChange={(e) =>
                  setNewFinding({ ...newFinding, title: e.target.value })
                }
              />
              <TextField
                label="Category"
                fullWidth
                margin="normal"
                value={newFinding.category}
                onChange={(e) =>
                  setNewFinding({ ...newFinding, category: e.target.value })
                }
              />
              <TextField
                select
                label="Severity"
                fullWidth
                margin="normal"
                value={newFinding.severity}
                onChange={(e) =>
                  setNewFinding({ ...newFinding, severity: e.target.value })
                }
              >
                {severities.map((sev) => (
                  <MenuItem key={sev} value={sev}>
                    {sev}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
                margin="normal"
                value={newFinding.description}
                onChange={(e) =>
                  setNewFinding({ ...newFinding, description: e.target.value })
                }
              />
              <TextField
                label="Impact"
                multiline
                rows={2}
                fullWidth
                margin="normal"
                value={newFinding.impact}
                onChange={(e) =>
                  setNewFinding({ ...newFinding, impact: e.target.value })
                }
              />
              <TextField
                label="Mitigation"
                multiline
                rows={2}
                fullWidth
                margin="normal"
                value={newFinding.mitigation}
                onChange={(e) =>
                  setNewFinding({ ...newFinding, mitigation: e.target.value })
                }
              />

              {/* Affected Endpoints Selection */}
              <Typography variant="h6" style={{ marginTop: "10px" }}>
                Affected Endpoints
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Select Affected Endpoints</InputLabel>
                <Select
                  multiple
                  value={newFinding.affectedEndpoints || []}
                  onChange={(e) =>
                    setNewFinding({
                      ...newFinding,
                      affectedEndpoints: e.target.value,
                    })
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {[
                    ...endpoints,
                    ...urls.split("\n").filter((line) => line.trim()),
                  ].map((endpoint) => (
                    <MenuItem key={endpoint} value={endpoint}>
                      {endpoint}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {newFinding.affectedEndpoints &&
                newFinding.affectedEndpoints.length > 0 && (
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    style={{ marginTop: 5 }}
                  >
                    {newFinding.affectedEndpoints.length} endpoint(s) selected
                  </Typography>
                )}

              <Typography variant="h6" style={{ marginTop: "10px" }}>
                PoC Images
              </Typography>
              <Button variant="outlined" component="label">
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleAddPoCImage}
                />
              </Button>

              {newFinding.pocImages.map((img, idx) => (
                <Box key={idx} mt={1}>
                  <Typography variant="body2">{img.name}</Typography>
                  <img
                    src={img.data}
                    alt={img.name}
                    style={{ maxWidth: "200px" }}
                  />
                </Box>
              ))}

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addFinding}
              >
                Add Finding
              </Button>
            </Box>
          </TabPanel>

          {/* Original Assessment Tab for Reassessments */}
          {report.assessmentType === "Reassessment" && (
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h5" style={{ marginTop: "20px" }}>
                Original Assessment Reference
              </Typography>
              {report.parentAssessmentData ? (
                <>
                  <Typography variant="h6" style={{ marginTop: "20px" }}>
                    Original Project Details
                  </Typography>
                  <Typography>
                    <strong>Project:</strong>{" "}
                    {report.parentAssessmentData.projectName}
                  </Typography>
                  <Typography>
                    <strong>Version:</strong>{" "}
                    {report.parentAssessmentData.version}
                  </Typography>
                  <Typography>
                    <strong>Period:</strong>{" "}
                    {report.parentAssessmentData.startDate} to{" "}
                    {report.parentAssessmentData.endDate}
                  </Typography>

                  <Typography variant="h6" style={{ marginTop: "20px" }}>
                    Original Findings (
                    {report.parentAssessmentData.detailedFindings?.length || 0})
                  </Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>No</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(report.parentAssessmentData.detailedFindings || []).map(
                        (f, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{f.title}</TableCell>
                            <TableCell>{f.severity}</TableCell>
                            <TableCell>{f.status}</TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <Typography>No original assessment data available.</Typography>
              )}
            </TabPanel>
          )}

          <Box mt={2}>
            <Button variant="contained" color="primary" onClick={handleSave}>
              Save
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleExportPDF}
              style={{ marginLeft: "10px" }}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleExportWord}
              style={{ marginLeft: "10px" }}
            >
              Export Word
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleExportZip}
              style={{ marginLeft: "10px" }}
            >
              Export ZIP
            </Button>

            {assessmentType === "Initial" && (
              <Button
                variant="outlined"
                color="info"
                onClick={handleCreateReassessment}
                style={{ marginLeft: "10px" }}
              >
                Create Reassessment
              </Button>
            )}

            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                setConfirmDialog({
                  open: true,
                  title: "Delete Report",
                  message:
                    "Are you sure you want to delete this report? This action cannot be undone.",
                  severity: "error",
                  onConfirm: () => {
                    useReportsStore.getState().deleteReport(id);
                    toast.success("Report deleted!");
                    navigate("/");
                  },
                });
              }}
              style={{ marginLeft: "10px" }}
            >
              Delete
            </Button>

            {exportPath && (
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  Export path configured: {exportPath}
                  <br />
                  <em>
                    Note: In web version, files download to browser's default
                    location
                  </em>
                </Typography>
              </Box>
            )}
          </Box>

          {/* Dialog for selected finding details */}
          {selectedFinding && (
            <Dialog open={true} onClose={() => setSelectedFinding(null)}>
              <DialogTitle>{selectedFinding.title}</DialogTitle>
              <DialogContent>
                <Typography variant="subtitle1">
                  Category: {selectedFinding.category}
                </Typography>
                <Typography variant="subtitle1">
                  Severity: {selectedFinding.severity}
                </Typography>
                <Typography variant="subtitle1" style={{ marginTop: 10 }}>
                  Description:
                </Typography>
                <Typography variant="body2">
                  {selectedFinding.description}
                </Typography>
                <Typography variant="subtitle1" style={{ marginTop: 10 }}>
                  Impact:
                </Typography>
                <Typography variant="body2">
                  {selectedFinding.impact}
                </Typography>
                <Typography variant="subtitle1" style={{ marginTop: 10 }}>
                  Mitigation:
                </Typography>
                <Typography variant="body2">
                  {selectedFinding.mitigation}
                </Typography>
                {selectedFinding.affectedEndpoints &&
                  selectedFinding.affectedEndpoints.length > 0 && (
                    <>
                      <Typography variant="subtitle1" style={{ marginTop: 10 }}>
                        Affected Endpoints:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                        {selectedFinding.affectedEndpoints.map(
                          (endpoint, idx) => (
                            <Chip
                              key={idx}
                              label={endpoint}
                              size="small"
                              variant="outlined"
                            />
                          )
                        )}
                      </Box>
                    </>
                  )}
                {selectedFinding.pocImages &&
                  selectedFinding.pocImages.length > 0 && (
                    <>
                      <Typography variant="subtitle1" style={{ marginTop: 10 }}>
                        PoC Images:
                      </Typography>
                      {selectedFinding.pocImages.map((img, idx) => (
                        <Box key={idx} mt={1}>
                          <Typography variant="body2">{img.name}</Typography>
                          <img
                            src={img.data}
                            alt={img.name}
                            style={{ maxWidth: "500px" }}
                          />
                        </Box>
                      ))}
                    </>
                  )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedFinding(null)}>Close</Button>
              </DialogActions>
            </Dialog>
          )}

          {/* Dialog for editing finding */}
          {editingFinding && (
            <Dialog
              open={true}
              onClose={() => setEditingFinding(null)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>Edit Finding</DialogTitle>
              <DialogContent>
                <TextField
                  label="Title"
                  fullWidth
                  margin="normal"
                  value={editingFinding.title}
                  onChange={(e) =>
                    setEditingFinding({
                      ...editingFinding,
                      title: e.target.value,
                    })
                  }
                />
                <TextField
                  label="Category"
                  fullWidth
                  margin="normal"
                  value={editingFinding.category}
                  onChange={(e) =>
                    setEditingFinding({
                      ...editingFinding,
                      category: e.target.value,
                    })
                  }
                />
                <TextField
                  select
                  label="Severity"
                  fullWidth
                  margin="normal"
                  value={editingFinding.severity}
                  onChange={(e) =>
                    setEditingFinding({
                      ...editingFinding,
                      severity: e.target.value,
                    })
                  }
                >
                  {severities.map((sev) => (
                    <MenuItem key={sev} value={sev}>
                      {sev}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Description"
                  multiline
                  rows={3}
                  fullWidth
                  margin="normal"
                  value={editingFinding.description}
                  onChange={(e) =>
                    setEditingFinding({
                      ...editingFinding,
                      description: e.target.value,
                    })
                  }
                />
                <TextField
                  label="Impact"
                  multiline
                  rows={2}
                  fullWidth
                  margin="normal"
                  value={editingFinding.impact}
                  onChange={(e) =>
                    setEditingFinding({
                      ...editingFinding,
                      impact: e.target.value,
                    })
                  }
                />
                <TextField
                  label="Mitigation"
                  multiline
                  rows={2}
                  fullWidth
                  margin="normal"
                  value={editingFinding.mitigation}
                  onChange={(e) =>
                    setEditingFinding({
                      ...editingFinding,
                      mitigation: e.target.value,
                    })
                  }
                />

                {/* Affected Endpoints Selection */}
                <Typography variant="h6" style={{ marginTop: "10px" }}>
                  Affected Endpoints
                </Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Select Affected Endpoints</InputLabel>
                  <Select
                    multiple
                    value={editingFinding.affectedEndpoints || []}
                    onChange={(e) =>
                      setEditingFinding({
                        ...editingFinding,
                        affectedEndpoints: e.target.value,
                      })
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {[
                      ...endpoints,
                      ...urls.split("\n").filter((line) => line.trim()),
                    ].map((endpoint) => (
                      <MenuItem key={endpoint} value={endpoint}>
                        {endpoint}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {editingFinding.affectedEndpoints &&
                  editingFinding.affectedEndpoints.length > 0 && (
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      style={{ marginTop: 5 }}
                    >
                      {editingFinding.affectedEndpoints.length} endpoint(s)
                      selected
                    </Typography>
                  )}

                <Typography variant="h6" style={{ marginTop: "10px" }}>
                  PoC Images
                </Typography>
                <Button variant="outlined" component="label">
                  Upload Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAddPoCImageToEdit}
                  />
                </Button>

                {(editingFinding.pocImages || []).map((img, idx) => (
                  <Box key={idx} mt={1}>
                    <Typography variant="body2">{img.name}</Typography>
                    <img
                      src={img.data}
                      alt={img.name}
                      style={{ maxWidth: "200px" }}
                    />
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        const updatedImages = [...editingFinding.pocImages];
                        updatedImages.splice(idx, 1);
                        setEditingFinding({
                          ...editingFinding,
                          pocImages: updatedImages,
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEditingFinding(null)}>Cancel</Button>
                <Button onClick={saveEditedFinding} variant="contained">
                  Save Changes
                </Button>
              </DialogActions>
            </Dialog>
          )}
        </>
      ) : (
        <Typography variant="h6">Report not found</Typography>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        severity={confirmDialog.severity}
        confirmText={confirmDialog.severity === "error" ? "Delete" : "Confirm"}
        cancelText="Cancel"
      />
    </Container>
  );
}

export default EditReport;
