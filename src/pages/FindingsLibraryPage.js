import React, { useState } from "react";
import {
  Container,
  Typography,
  Button,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import useFindingsLibraryStore from "../store/useFindingsLibraryStore";

function FindingsLibraryPage() {
  const { findings, addFindingToLibrary, removeFindingFromLibrary } =
    useFindingsLibraryStore();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("Low");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [mitigation, setMitigation] = useState("");

  const severities = ["Critical", "High", "Medium", "Low", "Informational"];

  const handleAdd = () => {
    addFindingToLibrary({
      title,
      category,
      severity,
      description,
      impact,
      mitigation,
      pocImages: [],
    });
    setTitle("");
    setCategory("");
    setSeverity("Low");
    setDescription("");
    setImpact("");
    setMitigation("");
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Findings Library
      </Typography>
      <Typography variant="h6">Add Common Finding</Typography>
      <TextField
        label="Title"
        fullWidth
        margin="normal"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <TextField
        label="Category"
        fullWidth
        margin="normal"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <TextField
        select
        label="Severity"
        fullWidth
        margin="normal"
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
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
      />
      <TextField
        label="Impact"
        multiline
        rows={2}
        fullWidth
        margin="normal"
        value={impact}
        onChange={(e) => setImpact(e.target.value)}
      />
      <TextField
        label="Mitigation"
        multiline
        rows={2}
        fullWidth
        margin="normal"
        value={mitigation}
        onChange={(e) => setMitigation(e.target.value)}
      />

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        style={{ marginTop: "10px" }}
      >
        Add to Library
      </Button>

      <Typography variant="h5" gutterBottom style={{ marginTop: "40px" }}>
        Existing Library Findings
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Severity</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {findings.map((f, i) => (
            <TableRow key={i}>
              <TableCell>{f.title}</TableCell>
              <TableCell>{f.severity}</TableCell>
              <TableCell>
                <IconButton onClick={() => removeFindingFromLibrary(i)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}

export default FindingsLibraryPage;
