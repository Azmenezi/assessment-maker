import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
} from "@mui/material";
import useReportsStore from "../store/useReportsStore";

function Home() {
  const reports = useReportsStore((state) => state.reports);
  const navigate = useNavigate();

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Penetration Test Reports
      </Typography>
      <Button variant="contained" onClick={() => navigate("/new")}>
        Create New Report
      </Button>
      <Button
        variant="outlined"
        onClick={() => navigate("/templates")}
        style={{ marginLeft: "10px" }}
      >
        Edit Templates
      </Button>
      <Button
        variant="outlined"
        onClick={() => navigate("/settings")}
        style={{ marginLeft: "10px" }}
      >
        Settings
      </Button>
      <Button
        variant="outlined"
        onClick={() => navigate("/findings-library")}
        style={{ marginLeft: "10px" }}
      >
        Findings Library
      </Button>
      <Button
        variant="outlined"
        onClick={() => navigate("/backup-restore")}
        style={{ marginLeft: "10px" }}
      >
        Backup/Restore
      </Button>
      <Button
        variant="outlined"
        onClick={() => navigate("/analytics")}
        style={{ marginLeft: "10px" }}
      >
        Analytics
      </Button>
      <List>
        {reports
          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
          .map((report) => (
            <ListItem
              button
              key={report.id}
              onClick={() => navigate(`/edit/${report.id}`)}
            >
              <ListItemText
                primary={`${report.projectName} - v${report.version} (${report.assessmentType})`}
                secondary={`${report.startDate} - ${report.endDate}`}
              />
            </ListItem>
          ))}
      </List>
    </Container>
  );
}

function MostRepeatedFindings() {
  const reports = useReportsStore((state) => state.reports);

  const counts = {};
  for (const report of reports) {
    for (const f of report.detailedFindings) {
      counts[f.title] = (counts[f.title] || 0) + 1;
    }
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Most Repeated Findings
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Finding Title</TableCell>
            <TableCell>Occurrences</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map(([title, count]) => (
            <TableRow key={title}>
              <TableCell>{title}</TableCell>
              <TableCell>{count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}

export default Home;
