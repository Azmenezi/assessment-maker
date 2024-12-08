import React from "react";
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

const theme = createTheme({
  // Customize MUI theme if needed
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<NewReport />} />
            <Route path="/edit/:id" element={<EditReport />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/findings-library" element={<FindingsLibraryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/backup-restore" element={<BackupRestorePage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
