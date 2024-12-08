import pdfMake from "pdfmake/build/pdfmake";
// eslint-disable-next-line
import pdfFonts from "pdfmake/build/vfs_fonts";
// pdfMake.vfs = pdfFonts.pdfMake.vfs;

/**
 * Export a report to PDF using pdfMake.
 * @param {Object} report - The report object.
 * @param {Object} settings - Global settings like defaultLogo.
 */
export async function exportReportToPDF(report, settings) {
  const {
    projectName,
    version,
    assessmentType,
    startDate,
    endDate,
    assessorName,
    scope,
    methodology,
    platform,
    urls,
    credentials,
    detailedFindings,
  } = report;

  // Ensure detailedFindings is an array
  const findings = Array.isArray(detailedFindings) ? detailedFindings : [];

  // Calculate severity counts
  const counts = {
    critical: findings.filter((f) => f.severity === "Critical").length,
    high: findings.filter((f) => f.severity === "HIGH").length,
    medium: findings.filter((f) => f.severity === "Medium").length,
    low: findings.filter((f) => f.severity === "Low").length,
    informational: findings.filter((f) => f.severity === "Informational")
      .length,
  };

  // Determine overall risk rating:
  let overallRiskRating = "None"; // default
  let ratingColor = "black";
  if (counts.critical > 0) {
    overallRiskRating = "Critical";
    ratingColor = "#940000";
  } else if (counts.high > 0) {
    overallRiskRating = "High";
    ratingColor = "#FF0000";
  } else if (counts.medium > 0) {
    overallRiskRating = "Medium";
    ratingColor = "#FFA500";
  } else if (counts.low > 0) {
    overallRiskRating = "Low";
    ratingColor = "#FFFF00";
  } else if (counts.informational > 0) {
    overallRiskRating = "Informational";
    ratingColor = "#ADD8E6";
  }

  // Findings summary table
  const findingsTableBody = [
    [
      { text: "No", bold: true, fillColor: "#CCCCCC" },
      { text: "Vulnerability", bold: true, fillColor: "#CCCCCC" },
      { text: "Severity", bold: true, fillColor: "#CCCCCC" },
      { text: "Status", bold: true, fillColor: "#CCCCCC" },
    ],
  ];

  findings.forEach((f, index) => {
    findingsTableBody.push([
      {
        text: (index + 1).toString(),
        fillColor: ratingColor === "black" ? "" : ratingColor,
      },
      {
        text: f.title,
        fillColor: ratingColor === "black" ? "" : ratingColor,
      },
      {
        text: f.severity,
        fillColor: ratingColor === "black" ? "" : ratingColor,
      },
      {
        text: f.status || "OPEN",
        fillColor: ratingColor === "black" ? "" : ratingColor,
      },
    ]);
  });

  const criticalCount = counts.critical;
  const highCount = counts.high;
  const mediumCount = counts.medium;
  const lowCount = counts.low;
  const infoCount = counts.informational;
  const total = criticalCount + highCount + mediumCount + lowCount + infoCount;

  const severityMatrixBody = [
    [
      {
        text: criticalCount.toString() + "\nCritical",
        fillColor: "#940000",
        color: "white",
        alignment: "center",
      },
      {
        text: highCount.toString() + "\nHigh",
        fillColor: "#FF0000",
        color: "white",
        alignment: "center",
      },
      {
        text: mediumCount.toString() + "\nMedium",
        fillColor: "#FFA500",
        alignment: "center",
      },
    ],
    [
      {
        text: lowCount.toString() + "\nLow",
        fillColor: "#FFFF00",
        alignment: "center",
      },
      {
        text: infoCount.toString() + "\nInformational",
        fillColor: "#ADD8E6",
        alignment: "center",
      },
      {
        text: total.toString() + "\nTotal",
        fillColor: "#C0C0C0",
        alignment: "center",
      },
    ],
  ];

  const content = [];

  content.push({
    image: settings.defaultLogo,
    style: "title",
    alignment: "center",
    width: 200,
    margin: [0, 50, 0, 20],
  });
  content.push({
    text: "Penetration Test Report",
    style: "title",
    alignment: "center",
    margin: [0, 50, 0, 20],
  });
  content.push({
    text: "Warba Bank",
    style: "header",
    alignment: "center",
    margin: [0, 20, 0, 5],
  });
  content.push({
    text: "Cyber Security Division/Assessment Unit",
    style: "subheader",
    alignment: "center",
    margin: [0, 0, 0, 20],
  });
  content.push({
    style: "table",
    table: {
      widths: ["auto", "*"],
      body: [
        [
          { text: "Project Name", bold: true },
          {
            text:
              projectName +
              (assessmentType === "Reassessment" ? " (Reassessment)" : ""),
          },
        ],
        [{ text: "Version", bold: true }, { text: version }],
        [{ text: "Date", bold: true }, { text: startDate }],
        [{ text: "Assessor", bold: true }, { text: assessorName }],
      ],
    },
    margin: [0, 20, 0, 20],
  });

  content.push({ text: "", pageBreak: "after" });

  // Executive Summary & Scope
  content.push({ text: "1. Executive Summary", style: "sectionHeader" });
  content.push({ text: "1.1 Assessment Overview", style: "subSectionHeader" });
  content.push({
    text: `The assessment of ${projectName} commenced on ${startDate} and concluded on ${endDate}. This assessment was requested by Digital Factory Division in order to identify any final concerns prior to the standard being finalized and published.
    
The assessment engaged the services of Warba in order to:
• Evaluate whether the security controls introduced in ${projectName} were effective when implemented.
• Gauge whether the risk identified within the protocol was at a level acceptable and that such risk would not have a significant impact on the delivery of the service, expose clients to harm or loss or other such consequences.

The results provided are the output of the security assessment performed and should be used as input into a larger risk management process. These results are a point in time assessment of the system and environment as they were presented for testing. Any changes could yield a different set of results.`,
    style: "normal",
  });

  content.push({
    text: "1.2 Scope",
    style: "subSectionHeader",
    margin: [0, 20, 0, 0],
  });
  content.push({
    text: scope,
    style: "normal",
  });

  // Platform Table
  content.push({
    text: "Platform & URLs",
    style: "subSectionHeader",
    margin: [0, 20, 0, 0],
  });
  content.push({
    style: "table",
    table: {
      widths: ["auto", "*"],
      body: [
        [{ text: "Platform", bold: true }, { text: platform }],
        [{ text: "IP Address/URL's", bold: true }, { text: urls }],
        [{ text: "Credentials", bold: true }, { text: credentials }],
      ],
    },
    margin: [0, 10, 0, 20],
  });

  // High Level Summary
  content.push({
    text: "2. High Level Summary",
    style: "sectionHeader",
    margin: [0, 20, 0, 0],
  });
  content.push({ text: methodology, style: "normal" });

  // Detailed Findings Section
  content.push({
    text: "3. Detailed Finding:",
    style: "sectionHeader",
    margin: [0, 20, 0, 0],
  });
  content.push({
    text: [
      {
        text: "The overall information security risk rating was calculated as: ",
        style: "normal",
      },
      { text: overallRiskRating, style: "normal", color: ratingColor },
      { text: ".", style: "normal" },
    ],
    style: "normal",
    margin: [0, 5, 0, 5],
  });

  // Findings summary table
  content.push({
    style: "table",
    table: {
      widths: [20, "*", 60, 60],
      body: findingsTableBody,
    },
    margin: [0, 10, 0, 10],
  });

  // Severity matrix table
  content.push({
    style: "table",
    table: {
      widths: [60, 60, 60],
      body: severityMatrixBody,
    },
    margin: [0, 10, 0, 20],
  });

  // 3.1. VULNERABILITIES FOUND
  content.push({
    text: "3.1.  VULNERABILITIES FOUND:",
    style: "subSectionHeader",
    margin: [0, 20, 0, 0],
  });

  findings.forEach((finding, idx) => {
    content.push({
      text: `${idx + 1}. ${finding.title}`,
      style: "findingTitle",
      margin: [0, 10, 0, 0],
    });
    content.push({ text: `Category: ${finding.category}`, style: "normal" });
    content.push({
      text: `Severity: ${finding.severity}`,
      style: "normal",
      margin: [0, 2, 0, 0],
    });
    content.push({
      text: `Description: ${finding.description}`,
      style: "normal",
      margin: [0, 5, 0, 0],
    });
    content.push({
      text: `Impact: ${finding.impact}`,
      style: "normal",
      margin: [0, 5, 0, 0],
    });
    content.push({
      text: `Mitigation: ${finding.mitigation}`,
      style: "normal",
      margin: [0, 5, 0, 10],
    });

    // PoC Images
    if (finding.pocImages && finding.pocImages.length > 0) {
      content.push({
        text: "PoC:",
        style: "normal",
        margin: [0, 5, 0, 2],
      });
      finding.pocImages.forEach((img) => {
        content.push({
          image: img.data,
          width: 300,
          margin: [0, 5, 0, 10],
        });
      });
    }
  });

  // Conclusion/Assessor Statement
  content.push({
    text: "4. Assessor Statement",
    style: "sectionHeader",
    margin: [0, 20, 0, 0],
  });
  content.push({
    text: [
      { text: assessorName, bold: true, style: "normal" },
      { text: " has completed a Security Assessment of ", style: "normal" },
      { text: projectName, bold: true, style: "normal" },
      {
        text: " in accordance with: OWASP top 10, PCI-DSS, ISO 27001 and the result is Compliant.",
        style: "normal",
      },
    ],
    style: "normal",
    margin: [0, 10, 0, 0],
  });

  const docDefinition = {
    header: (currentPage, pageCount) => {
      return {
        columns: [
          {
            text: "Penetration Test Report",
            alignment: "left",
            margin: [30, 20, 0, 10],
            style: "headerText",
          },
          {
            image: settings.defaultLogo,
            width: 50,
            alignment: "right",
            margin: [0, 10, 20, 10],
            style: "headerText",
          },
        ],
      };
    },
    footer: (currentPage, pageCount) => {
      return {
        text: currentPage.toString() + " of " + pageCount,
        alignment: "center",
        margin: [0, 0, 0, 10],
      };
    },
    content: content,
    styles: {
      title: { fontSize: 22, bold: true },
      header: { fontSize: 16, bold: true },
      subheader: { fontSize: 12, bold: true },
      sectionHeader: { fontSize: 14, bold: true },
      subSectionHeader: { fontSize: 12, bold: true },
      normal: { fontSize: 10 },
      findingTitle: { fontSize: 12, bold: true },
      headerText: { fontSize: 10, bold: true },
    },
    defaultStyle: {
      fontSize: 10,
    },
  };

  const pdfDocGenerator = pdfMake.createPdf(docDefinition);
  pdfDocGenerator.download(
    `${projectName.replace(/\s+/g, " ")} - Penetration Test Report_${
      new Date().toISOString().split("T")[0]
    }.pdf`
  );
}
