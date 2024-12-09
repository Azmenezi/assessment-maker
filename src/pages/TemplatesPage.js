import React, { useState } from "react";
import { Container, Typography, TextField, Button } from "@mui/material";
import useTemplatesStore from "../store/useTemplatesStore";

function TemplatesPage() {
  const {
    executiveSummary,
    scope,
    methodology,
    assessorName,
    setExecutiveSummary,
    setScope,
    setMethodology,
    setAssessorName,
  } = useTemplatesStore();

  const [localExecutiveSummary, setLocalExecutiveSummary] =
    useState(executiveSummary);
  const [localScope, setLocalScope] = useState(scope);
  const [localMethodology, setLocalMethodology] = useState(methodology);
  const [localAssessorName, setLocalAssessorName] = useState(assessorName);

  const handleSave = () => {
    setExecutiveSummary(localExecutiveSummary);
    setScope(localScope);
    setMethodology(localMethodology);
    setAssessorName(localAssessorName);
    alert("Templates saved!");
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Templates
      </Typography>
      <Typography variant="h6">Azure protection list Template</Typography>
      <TextField
        multiline
        rows={4}
        fullWidth
        margin="normal"
        value={localExecutiveSummary}
        onChange={(e) => setLocalExecutiveSummary(e.target.value)}
      />

      <Typography variant="h6">Scope Template</Typography>
      <TextField
        multiline
        rows={4}
        fullWidth
        margin="normal"
        value={localScope}
        onChange={(e) => setLocalScope(e.target.value)}
      />

      <Typography variant="h6">Methodology Template</Typography>
      <TextField
        multiline
        rows={4}
        fullWidth
        margin="normal"
        value={localMethodology}
        onChange={(e) => setLocalMethodology(e.target.value)}
      />
      <Typography variant="h6">Assessor Name</Typography>
      <TextField
        fullWidth
        margin="normal"
        value={localAssessorName}
        onChange={(e) => setLocalAssessorName(e.target.value)}
      />

      <Button variant="contained" color="primary" onClick={handleSave}>
        Save Templates
      </Button>
    </Container>
  );
}

export default TemplatesPage;
