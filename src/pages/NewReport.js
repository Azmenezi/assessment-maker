import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  MenuItem,
} from "@mui/material";
import useReportsStore from "../store/useReportsStore";
import useTemplatesStore from "../store/useTemplatesStore";
import { useNavigate } from "react-router-dom";

function NewReport() {
  const createReport = useReportsStore((state) => state.createReport);
  const { executiveSummary, scope, methodology, conclusion, assessorName } =
    useTemplatesStore();

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

  const navigate = useNavigate();

  const handleCreate = () => {
    const newId = createReport({
      projectName,
      version,
      assessmentType,
      startDate,
      endDate,
      assessorName: localAssessorName,
      scope,
      methodology,
      executiveSummary,
      detailedFindings: [],
      conclusion,
      logo: "",
      platform,
      urls,
      credentials,
    });
    navigate(`/edit/${newId}`);
  };

  return (
    <Container style={{ paddingBottom: 40 }}>
      <Typography marginTop={4} variant="h5" gutterBottom>
        New Report
      </Typography>
      <TextField
        type="date"
        label="From Date"
        InputLabelProps={{ shrink: true }}
        style={{ marginRight: "10px" }}
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <TextField
        type="date"
        label="End Date"
        InputLabelProps={{ shrink: true }}
        style={{ marginRight: "10px" }}
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
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
        label="Assessor Name"
        fullWidth
        margin="normal"
        value={localAssessorName}
        onChange={(e) => localAssessorName(e.target.value)}
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

      <Button variant="contained" color="primary" onClick={handleCreate}>
        Create & Edit Report
      </Button>
    </Container>
  );
}

export default NewReport;
