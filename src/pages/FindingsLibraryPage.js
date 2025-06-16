import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import useFindingsLibraryStore from "../store/useFindingsLibraryStore";

function FindingsLibraryPage() {
  const {
    findings,
    addFindingToLibrary,
    updateFindingInLibrary,
    removeFindingFromLibrary,
    clearLibrary,
  } = useFindingsLibraryStore();

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("Low");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [mitigation, setMitigation] = useState("");

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingFinding, setEditingFinding] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const severities = ["Critical", "High", "Medium", "Low", "Informational"];

  // Get unique categories from existing findings
  const uniqueCategories = [
    ...new Set(findings.map((f) => f.category).filter(Boolean)),
  ];

  const handleAdd = () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    addFindingToLibrary({
      title: title.trim(),
      category: category.trim(),
      severity,
      description: description.trim(),
      impact: impact.trim(),
      mitigation: mitigation.trim(),
      pocImages: [],
      affectedEndpoints: [],
    });

    // Clear form
    setTitle("");
    setCategory("");
    setSeverity("Low");
    setDescription("");
    setImpact("");
    setMitigation("");
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditingFinding({ ...findings[index] });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingFinding.title.trim()) {
      alert("Title is required");
      return;
    }

    updateFindingInLibrary(editingIndex, {
      ...editingFinding,
      title: editingFinding.title.trim(),
      category: editingFinding.category.trim(),
      description: editingFinding.description.trim(),
      impact: editingFinding.impact.trim(),
      mitigation: editingFinding.mitigation.trim(),
    });

    setEditDialogOpen(false);
    setEditingFinding(null);
    setEditingIndex(-1);
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditingFinding(null);
    setEditingIndex(-1);
  };

  const handleDelete = (index) => {
    if (
      window.confirm(
        "Are you sure you want to delete this finding from the library?"
      )
    ) {
      removeFindingFromLibrary(index);
    }
  };

  const handleClearLibrary = () => {
    if (
      window.confirm(
        "Are you sure you want to clear the entire findings library? This cannot be undone."
      )
    ) {
      clearLibrary();
    }
  };

  // Filter findings based on search and filters
  const filteredFindings = findings.filter((finding) => {
    const matchesSearch =
      !searchTerm ||
      finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === "All" || finding.severity === severityFilter;
    const matchesCategory =
      categoryFilter === "All" || finding.category === categoryFilter;

    return matchesSearch && matchesSeverity && matchesCategory;
  });

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "error";
      case "High":
        return "error";
      case "Medium":
        return "warning";
      case "Low":
        return "info";
      case "Informational":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Findings Library
      </Typography>

      <Grid container spacing={3}>
        {/* Add New Finding Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add New Finding
            </Typography>

            <TextField
              label="Title *"
              fullWidth
              margin="normal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              size="small"
            />

            <TextField
              label="Category"
              fullWidth
              margin="normal"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              size="small"
              placeholder="e.g., Authentication, Authorization, Input Validation"
            />

            <TextField
              select
              label="Severity"
              fullWidth
              margin="normal"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              size="small"
            >
              {severities.map((sev) => (
                <MenuItem key={sev} value={sev}>
                  {sev}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Description"
              multiline
              rows={3}
              fullWidth
              margin="normal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              size="small"
            />

            <TextField
              label="Impact"
              multiline
              rows={2}
              fullWidth
              margin="normal"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              size="small"
            />

            <TextField
              label="Mitigation"
              multiline
              rows={2}
              fullWidth
              margin="normal"
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
              size="small"
            />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              fullWidth
              sx={{ mt: 2 }}
            >
              Add to Library
            </Button>
          </Paper>
        </Grid>

        {/* Library Statistics */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Library Statistics
            </Typography>

            <Box mb={2}>
              <Typography variant="body1">
                Total Findings: <strong>{findings.length}</strong>
              </Typography>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              By Severity:
            </Typography>
            {severities.map((severity) => {
              const count = findings.filter(
                (f) => f.severity === severity
              ).length;
              return count > 0 ? (
                <Box
                  key={severity}
                  display="flex"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Chip
                    label={severity}
                    color={getSeverityColor(severity)}
                    size="small"
                  />
                  <Typography variant="body2">{count}</Typography>
                </Box>
              ) : null;
            })}

            {uniqueCategories.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Categories: {uniqueCategories.length}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {uniqueCategories.slice(0, 10).map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  {uniqueCategories.length > 10 && (
                    <Chip
                      label={`+${uniqueCategories.length - 10} more`}
                      size="small"
                    />
                  )}
                </Box>
              </>
            )}

            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              onClick={handleClearLibrary}
              fullWidth
              sx={{ mt: 2 }}
              disabled={findings.length === 0}
            >
              Clear Library
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Search and Filter Section */}
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Library Findings ({filteredFindings.length})
        </Typography>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Search"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "action.active" }} />
                ),
              }}
              size="small"
              placeholder="Search title, category, or description..."
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Severity</InputLabel>
              <Select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                label="Filter by Severity"
              >
                <MenuItem value="All">All Severities</MenuItem>
                {severities.map((severity) => (
                  <MenuItem key={severity} value={severity}>
                    {severity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Filter by Category"
              >
                <MenuItem value="All">All Categories</MenuItem>
                {uniqueCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {filteredFindings.length === 0 ? (
          <Alert severity="info">
            {findings.length === 0
              ? "No findings in library yet. Add your first finding above!"
              : "No findings match your search criteria."}
          </Alert>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFindings.map((finding, index) => {
                const originalIndex = findings.indexOf(finding);
                return (
                  <TableRow key={originalIndex} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {finding.title}
                      </Typography>
                      {finding.description && (
                        <Typography variant="caption" color="textSecondary">
                          {finding.description.substring(0, 100)}
                          {finding.description.length > 100 ? "..." : ""}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {finding.category && (
                        <Chip
                          label={finding.category}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={finding.severity}
                        color={getSeverityColor(finding.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEdit(originalIndex)}
                        size="small"
                        title="Edit finding"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(originalIndex)}
                        size="small"
                        color="error"
                        title="Delete finding"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCancelEdit}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Finding</DialogTitle>
        <DialogContent>
          {editingFinding && (
            <>
              <TextField
                label="Title *"
                fullWidth
                margin="normal"
                value={editingFinding.title}
                onChange={(e) =>
                  setEditingFinding({
                    ...editingFinding,
                    title: e.target.value,
                  })
                }
              />

              <TextField
                label="Category"
                fullWidth
                margin="normal"
                value={editingFinding.category}
                onChange={(e) =>
                  setEditingFinding({
                    ...editingFinding,
                    category: e.target.value,
                  })
                }
              />

              <TextField
                select
                label="Severity"
                fullWidth
                margin="normal"
                value={editingFinding.severity}
                onChange={(e) =>
                  setEditingFinding({
                    ...editingFinding,
                    severity: e.target.value,
                  })
                }
              >
                {severities.map((sev) => (
                  <MenuItem key={sev} value={sev}>
                    {sev}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
                margin="normal"
                value={editingFinding.description}
                onChange={(e) =>
                  setEditingFinding({
                    ...editingFinding,
                    description: e.target.value,
                  })
                }
              />

              <TextField
                label="Impact"
                multiline
                rows={2}
                fullWidth
                margin="normal"
                value={editingFinding.impact}
                onChange={(e) =>
                  setEditingFinding({
                    ...editingFinding,
                    impact: e.target.value,
                  })
                }
              />

              <TextField
                label="Mitigation"
                multiline
                rows={2}
                fullWidth
                margin="normal"
                value={editingFinding.mitigation}
                onChange={(e) =>
                  setEditingFinding({
                    ...editingFinding,
                    mitigation: e.target.value,
                  })
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default FindingsLibraryPage;
