import React, { useState } from "react";
import { Container, Typography, TextField, Button } from "@mui/material";
import useTemplatesStore from "../store/useTemplatesStore";

function TemplatesPage() {
  const {
    executiveSummary,
    scope,
    methodology,
    setExecutiveSummary,
    setScope,
    setMethodology,
  } = useTemplatesStore();

  const [localExecutiveSummary, setLocalExecutiveSummary] =
    useState(executiveSummary);
  const [localScope, setLocalScope] = useState(scope);
  const [localMethodology, setLocalMethodology] = useState(methodology);

  const handleSave = () => {
    setExecutiveSummary(localExecutiveSummary);
    setScope(localScope);
    setMethodology(localMethodology);
    alert("Templates saved!");
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Templates
      </Typography>
      <Typography variant="h6">Executive Summary Template</Typography>
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

      <Button variant="contained" color="primary" onClick={handleSave}>
        Save Templates
      </Button>
    </Container>
  );
}

export default TemplatesPage;
