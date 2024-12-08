import React, { useRef, useState } from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import useSettingsStore from "../store/useSettingsStore";

function Settings() {
  const fileInputRef = useRef(null);
  const { defaultLogo, setDefaultLogo } = useSettingsStore();
  const [previewLogo, setPreviewLogo] = useState(defaultLogo);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64Logo = evt.target.result;
      setDefaultLogo(base64Logo);
      setPreviewLogo(base64Logo);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="h6">Default Logo</Typography>
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
    </Container>
  );
}

export default Settings;
