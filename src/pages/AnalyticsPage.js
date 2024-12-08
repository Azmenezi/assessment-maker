import React from "react";
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import useReportsStore from "../store/useReportsStore";

function AnalyticsPage() {
  const reports = useReportsStore((state) => state.reports);

  const counts = {};
  for (const report of reports) {
    for (const f of report.detailedFindings || []) {
      counts[f.title] = (counts[f.title] || 0) + 1;
    }
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Most Repeated Findings
      </Typography>
      {sorted.length === 0 ? (
        <Typography>No findings found.</Typography>
      ) : (
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
      )}
    </Container>
  );
}

export default AnalyticsPage;
