import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useReportsStore from "../store/useReportsStore";
import {
  Container,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Switch,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import useSettingsStore from "../store/useSettingsStore";
import { exportReportToPDF } from "../utils/exportPDF";
import { exportReportToWord } from "../utils/exportWord";
import useFindingsLibraryStore from "../store/useFindingsLibraryStore";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Select from "@mui/material/Select";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const getReportById = useReportsStore((state) => state.getReportById);
  const updateReport = useReportsStore((state) => state.updateReport);
  const { defaultLogo } = useSettingsStore();
  const report = getReportById(id);

  const [tabValue, setTabValue] = useState(0);

  const { findings: libraryFindings } = useFindingsLibraryStore();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedLibIndex, setSelectedLibIndex] = useState("");

  const handleOpenLibrary = () => setLibraryOpen(true);
  const handleCloseLibrary = () => setLibraryOpen(false);

  const applyLibraryFinding = () => {
    if (selectedLibIndex !== "") {
      const lf = libraryFindings[selectedLibIndex];
      setNewFinding({ ...lf, pocImages: [] }); // pocImages empty by default or copy if you want
      setLibraryOpen(false);
    }
  };

  // Local states to hold report data while editing
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
      urls,
      credentials,
    });
    //add all new findings to the library but do not duplicate
    for (const finding of detailedFindings) {
      const exists = libraryFindings.some(
        (lf) => lf.title === finding.title && lf.severity === finding.severity
      );
      if (!exists) {
        useFindingsLibraryStore.setState((state) => ({
          findings: [...state.findings, finding],
        }));
      }
    }

    alert("Report saved!");
  };

  const handleExportPDF = () => {
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
      },
      { defaultLogo }
    );
  };

  const handleExportWord = () => {
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

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handling Findings
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
    });
  };

  const deleteFinding = (index) => {
    const updated = [...detailedFindings];
    updated.splice(index, 1);
    setDetailedFindings(updated);
  };

  return (
    <Container style={{ paddingBottom: 40 }}>
      {report ? (
        <>
          <Typography variant="h4" gutterBottom>
            Editing Report: {projectName} (v{version})
          </Typography>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleChangeTab}>
              <Tab label="Details" />
              {/* <Tab label="Executive Summary & Scope" /> */}
              <Tab label="Findings" />
              {/* <Tab label="Conclusion" /> */}
            </Tabs>
          </Box>

          {/* Details Tab */}
          <TabPanel value={tabValue} index={0}>
            <TextField
              label="Project Name"
              fullWidth
              margin="normal"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <TextField
              label="Version"
              fullWidth
              margin="normal"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
            <TextField
              select
              label="Assessment Type"
              fullWidth
              margin="normal"
              value={assessmentType}
              onChange={(e) => setAssessmentType(e.target.value)}
            >
              <MenuItem value="Initial">Initial</MenuItem>
              <MenuItem value="Reassessment">Reassessment</MenuItem>
            </TextField>
            <TextField
              type="date"
              label="Start Date"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <TextField
              type="date"
              label="End Date"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
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
            />
            <TextField
              label="IP Address/URLs"
              fullWidth
              multiline
              rows={4}
              margin="normal"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
            />
            <TextField
              label="Credentials"
              fullWidth
              margin="normal"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
            />
          </TabPanel>

          {/* Executive Summary & Scope Tab */}
          {/* <TabPanel value={tabValue} index={1}>
            <Typography variant="h6">Executive Summary</Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              margin="normal"
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
            />
            <Typography variant="h6">Scope</Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              margin="normal"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            />
            <Typography variant="h6">Methodology</Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              margin="normal"
              value={methodology}
              onChange={(e) => setMethodology(e.target.value)}
            />
          </TabPanel> */}

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
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{f.title}</TableCell>
                    <TableCell>{f.severity}</TableCell>
                    <TableCell>
                      <Switch
                        checked={f.status === "OPEN"}
                        onChange={() => handleStatusToggle(index)}
                        color="primary"
                      />
                      {console.log(f)}
                      {f.status}
                    </TableCell>
                    <TableCell>
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

          {/* Conclusion Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6">Conclusion</Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              margin="normal"
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
            />
          </TabPanel>

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
              color="error"
              onClick={() => {
                if (
                  window.confirm("Are you sure you want to delete this report?")
                ) {
                  useReportsStore.getState().deleteReport(id);
                  alert("Report deleted!");
                  navigate("/");
                }
              }}
              style={{ marginLeft: "10px" }}
            >
              Delete
            </Button>
          </Box>
        </>
      ) : (
        <Typography variant="h6">Report not found</Typography>
      )}
    </Container>
  );
}

export default EditReport;
