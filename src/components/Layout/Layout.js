import { AppBar, Button, Toolbar, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

function Layout({ children }) {
  const navigate = useNavigate();
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Pentest Reports
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>
            Home
          </Button>
          <Button color="inherit" onClick={() => navigate("/templates")}>
            Templates
          </Button>
          <Button color="inherit" onClick={() => navigate("/settings")}>
            Settings
          </Button>
          <Button color="inherit" onClick={() => navigate("/findings-library")}>
            Findings Library
          </Button>
          <Button color="inherit" onClick={() => navigate("/analytics")}>
            Analytics
          </Button>
          <Button color="inherit" onClick={() => navigate("/backup-restore")}>
            Backup/Restore
          </Button>
        </Toolbar>
      </AppBar>
      {children}
    </>
  );
}

export default Layout;
