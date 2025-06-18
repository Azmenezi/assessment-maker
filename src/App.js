import React, { useEffect, useCallback, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NewReport from "./pages/NewReport";
import EditReport from "./pages/EditReport";
import TemplatesPage from "./pages/TemplatesPage";
import Settings from "./pages/Settings";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import FindingsLibraryPage from "./pages/FindingsLibraryPage";
import BackupRestorePage from "./pages/BackupRestorePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import Layout from "./components/Layout/Layout";
import { useToast } from "./hooks/useToast";
import { ToastContainer } from "./components/ToastContainer";
import useReportsStore from "./store/useReportsStore";
import { CircularProgress, Box, Typography } from "@mui/material";

const theme = createTheme({
  // Customize MUI theme if needed
});

// Create a context for toast notifications
export const ToastContext = React.createContext();

function App() {
  const toast = useToast();
  const { initialize, isLoading, error } = useReportsStore();
  const [initComplete, setInitComplete] = React.useState(false);
  const hasInitializedRef = useRef(false);

  const initApp = useCallback(async () => {
    if (hasInitializedRef.current) return; // Prevent multiple initializations

    hasInitializedRef.current = true;
    try {
      await initialize();
      setInitComplete(true);
    } catch (err) {
      console.error("Failed to initialize app:", err);
      toast.error("Failed to initialize application: " + err.message);
      setInitComplete(true); // Still allow app to load
    }
  }, [initialize, toast]);

  useEffect(() => {
    initApp();
  }, [initApp]);

  if (!initComplete || isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          gap={2}
        >
          <CircularProgress size={60} />
          <Typography variant="h6">
            {window.electronAPI
              ? "Loading Assessment Maker..."
              : "Initializing Web Version..."}
          </Typography>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <ToastContext.Provider value={toast}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/new" element={<NewReport />} />
              <Route path="/edit/:id" element={<EditReport />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route
                path="/findings-library"
                element={<FindingsLibraryPage />}
              />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/backup-restore" element={<BackupRestorePage />} />
            </Routes>
          </Layout>
          <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
        </Router>
      </ToastContext.Provider>
    </ThemeProvider>
  );
}

export default App;
