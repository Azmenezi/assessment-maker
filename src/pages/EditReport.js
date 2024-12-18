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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import useSettingsStore from "../store/useSettingsStore";
import { exportReportToPDF } from "../utils/exportPDF";
import { exportReportToWord } from "../utils/exportWord";
import useFindingsLibraryStore from "../store/useFindingsLibraryStore";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Packer } from "docx";

function TabPanel(props) {
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
  const { id } = useParams();
  const navigate = useNavigate();
  const getReportById = useReportsStore((state) => state.getReportById);
  const updateReport = useReportsStore((state) => state.updateReport);
  const { defaultLogo } = useSettingsStore();
  const report = getReportById(id);

  const { findings: libraryFindings, addFindingToLibrary } =
    useFindingsLibraryStore();

  const [tabValue, setTabValue] = useState(0);

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
    // Add new findings to library if not duplicate
    for (const finding of detailedFindings) {
      const exists = libraryFindings.some(
        (lf) => lf.title === finding.title && lf.severity === finding.severity
      );
      if (!exists) {
        addFindingToLibrary({ ...finding, status: "OPEN", pocImages: [] });
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

  // State for selected finding details dialog
  const [selectedFinding, setSelectedFinding] = useState(null);

  const handleExportZip = async () => {
    if (!report) return alert("No report to export.");

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
              name: `finding_${iidx + 1}_${f.title}.png`,
              data: img.data,
            });
        });
      }
    });

    const zip = new JSZip();
    const folderName = projectName.replace(/\s+/g, "_");
    const folder = zip.folder(folderName);

    folder.file(`${folderName}_report.pdf`, pdfBlob);
    folder.file(`${folderName}_report.docx`, wordBlob);

    const imagesFolder = folder.folder("findingsImages");
    images.forEach((img) => {
      const binaryData = base64ToBinary(img.data);
      imagesFolder.file(img.name, binaryData);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${folderName}.zip`);
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
              <Tab label="Findings" />
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
        </>
      ) : (
        <Typography variant="h6">Report not found</Typography>
      )}
    </Container>
  );
}

export default EditReport;
