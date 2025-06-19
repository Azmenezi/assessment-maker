import React, { useEffect } from "react";
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

const theme = createTheme({
  // Customize MUI theme if needed
});

// Create a context for toast notifications
export const ToastContext = React.createContext();

function App() {
  const toast = useToast();
  const { initializeReports, error } = useReportsStore();

  useEffect(() => {
    // Initialize reports from API on app start
    initializeReports();
  }, [initializeReports]);

  // Show error notification if API connection fails
  useEffect(() => {
    if (error) {
      toast.warning(
        `API Connection Issue: ${error}. Running in offline mode with localStorage.`
      );
    }
  }, [error, toast]);

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
