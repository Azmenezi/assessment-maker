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
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import useReportsStore from "../store/useReportsStore";

function filterReports(reports, { fromDate, toDate, searchTerm, openOnly }) {
  return reports.filter((report) => {
    const reportStart = new Date(report.startDate);
    const reportEnd = new Date(report.endDate);

    // Filter by date range
    if (fromDate && reportStart < new Date(fromDate)) {
      return false;
    }
    if (toDate && reportEnd > new Date(toDate)) {
      return false;
    }

    // Filter by search term (in projectName or findings title)
    if (searchTerm) {
      const nameMatch = report.projectName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const findingMatch = report.detailedFindings.some((f) =>
        f.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!nameMatch && !findingMatch) {
        return false;
      }
    }

    // Filter by openOnly
    if (openOnly) {
      const hasOpen = report.detailedFindings.some((f) => f.status === "OPEN");
      if (!hasOpen) return false;
    }

    return true;
  });
}

function ReportsFilter({ onFilterChange }) {
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [openOnly, setOpenOnly] = React.useState(false);

  React.useEffect(() => {
    onFilterChange({ fromDate, toDate, searchTerm, openOnly });
  }, [fromDate, toDate, searchTerm, openOnly, onFilterChange]);

  return (
    <div style={{ paddingBottom: "20px" }}>
      <TextField
        type="date"
        label="From Date"
        InputLabelProps={{ shrink: true }}
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        style={{ marginRight: "10px" }}
      />
      <TextField
        type="date"
        label="To Date"
        InputLabelProps={{ shrink: true }}
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        style={{ marginRight: "10px" }}
      />
      <TextField
        type="text"
        label="Search (Project/Finding)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginRight: "10px" }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
            color="primary"
          />
        }
        label="Open Findings Only"
      />
    </div>
  );
}

function Home() {
  const reports = useReportsStore((state) => state.reports);
  const navigate = useNavigate();

  const [filters, setFilters] = React.useState({
    fromDate: "",
    toDate: "",
    searchTerm: "",
    openOnly: false,
  });

  const filteredReports = React.useMemo(() => {
    const res = filterReports(reports, filters);
    // Sort by startDate descending after filtering
    return res.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [reports, filters]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Penetration Test Reports
      </Typography>
      <Button
        variant="contained"
        style={{ marginBottom: 20 }}
        onClick={() => navigate("/new")}
      >
        Create New Report
      </Button>

      <ReportsFilter onFilterChange={setFilters} />

      <List>
        {filteredReports.map((report) => (
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
