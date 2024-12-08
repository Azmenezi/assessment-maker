import React, { useState } from "react";
import { Container, Typography, Button } from "@mui/material";
import { exportAllData, importAllData } from "../utils/exportData";

function BackupRestorePage() {
  const [fileError, setFileError] = useState("");

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        importAllData(json);
      } catch (err) {
        setFileError("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Backup & Restore
      </Typography>
      <Button variant="contained" onClick={exportAllData}>
        Export All Data
      </Button>
      <Typography variant="h6" gutterBottom style={{ marginTop: "20px" }}>
        Import Data
      </Typography>
      <Button variant="outlined" component="label">
        Select Backup JSON
        <input
          type="file"
          hidden
          accept="application/json"
          onChange={handleImport}
        />
      </Button>
      {fileError && <Typography color="error">{fileError}</Typography>}
    </Container>
  );
}

export default BackupRestorePage;
