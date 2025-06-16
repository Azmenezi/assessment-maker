import React, { useRef, useState, useContext } from "react";
import { Container, Typography, Button, Box, TextField } from "@mui/material";
import useSettingsStore from "../store/useSettingsStore";
import { ToastContext } from "../App";

function Settings() {
  const toast = useContext(ToastContext);
  const fileInputRef = useRef(null);
  const { defaultLogo, exportPath, setDefaultLogo, setExportPath } =
    useSettingsStore();
  const [previewLogo, setPreviewLogo] = useState(defaultLogo);
  const [localExportPath, setLocalExportPath] = useState(exportPath);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64Logo = evt.target.result;
      setDefaultLogo(base64Logo);
      setPreviewLogo(base64Logo);
      toast.success("Logo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveExportPath = () => {
    setExportPath(localExportPath);
    toast.success("Export path saved successfully!");
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Default Logo
        </Typography>
        <Button variant="outlined" onClick={() => fileInputRef.current.click()}>
          Upload Logo
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleLogoUpload}
        />
        {previewLogo && (
          <Box mt={2}>
            <Typography variant="subtitle1">Preview:</Typography>
            <img
              src={previewLogo}
              alt="Default Logo"
              style={{ maxHeight: "100px" }}
            />
          </Box>
        )}
      </Box>

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Default Export Path
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Set a default folder path for exporting reports (for web version, this
          is just a reference)
        </Typography>
        <TextField
          fullWidth
          label="Export Path"
          value={localExportPath}
          onChange={(e) => setLocalExportPath(e.target.value)}
          placeholder="e.g., /Users/username/Documents/Reports or C:\Reports"
          margin="normal"
        />
        <Button
          variant="contained"
          onClick={handleSaveExportPath}
          style={{ marginTop: 8 }}
        >
          Save Export Path
        </Button>
        {exportPath && (
          <Box mt={1}>
            <Typography variant="body2" color="primary">
              Current export path: {exportPath}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default Settings;
