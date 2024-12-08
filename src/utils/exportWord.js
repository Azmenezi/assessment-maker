import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
} from "docx";

async function base64ToArrayBuffer(base64) {
  const res = await fetch(base64);
  const blob = await res.blob();
  return new Uint8Array(await blob.arrayBuffer());
}

// Helper functions to create styled text runs and paragraphs to mimic PDF styles
function titleParagraph(text) {
  // title: fontSize:22 ~ size:44 half-points, bold
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 44 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  });
}

function headerParagraph(text) {
  // header: fontSize:16 ~ size:32 half-points, bold
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  });
}

function subheaderParagraph(text) {
  // subheader: fontSize:12 ~ size:24 half-points, bold
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });
}

function sectionHeaderParagraph(text) {
  // sectionHeader: fontSize:14 ~ size:28 half-points, bold
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28 })],
    spacing: { before: 200, after: 100 },
  });
}

function subSectionHeaderParagraph(text) {
  // subSectionHeader: fontSize:12 ~ size:24 half-points, bold
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    spacing: { before: 200, after: 100 },
  });
}

function normalParagraph(text, options = {}) {
  // normal: fontSize:10 ~ size:20 half-points
  // Add spacing if passed in options
  return new Paragraph({
    children: [new TextRun({ text, size: 20 })],
    spacing: { before: options.before || 0, after: options.after || 0 },
  });
}

function findingTitleParagraph(text) {
  // findingTitle: fontSize:12 ~ size:24 half-points, bold
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    spacing: { before: 200, after: 100 },
  });
}

function pageBreakParagraph() {
  // Insert a page break
  return new Paragraph({ text: "", pageBreakBefore: true });
}

export async function exportReportToWord(report, settings) {
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

  const findings = Array.isArray(detailedFindings) ? detailedFindings : [];

  const counts = {
    critical: findings.filter((f) => f.severity === "Critical").length,
    high: findings.filter((f) => f.severity === "HIGH").length,
    medium: findings.filter((f) => f.severity === "Medium").length,
    low: findings.filter((f) => f.severity === "Low").length,
    informational: findings.filter((f) => f.severity === "Informational")
      .length,
  };

  let overallRiskRating = "None";
  let ratingColor = "#000000";
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

  const criticalCount = counts.critical;
  const highCount = counts.high;
  const mediumCount = counts.medium;
  const lowCount = counts.low;
  const infoCount = counts.informational;
  const total = criticalCount + highCount + mediumCount + lowCount + infoCount;

  const cellShade =
    ratingColor !== "#000000" ? ratingColor.replace("#", "") : null;

  // Findings Table
  const findingsTableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "No", bold: true, size: 20 })],
            }),
          ],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Vulnerability", bold: true, size: 20 }),
              ],
            }),
          ],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Severity", bold: true, size: 20 }),
              ],
            }),
          ],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Status", bold: true, size: 20 })],
            }),
          ],
          shading: { fill: "CCCCCC" },
        }),
      ],
    }),
  ];

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    findingsTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [normalParagraph(String(i + 1))],
            ...(cellShade ? { shading: { fill: cellShade } } : {}),
          }),
          new TableCell({
            children: [normalParagraph(f.title)],
            ...(cellShade ? { shading: { fill: cellShade } } : {}),
          }),
          new TableCell({
            children: [normalParagraph(f.severity)],
            ...(cellShade ? { shading: { fill: cellShade } } : {}),
          }),
          new TableCell({
            children: [normalParagraph(f.status || "OPEN")],
            ...(cellShade ? { shading: { fill: cellShade } } : {}),
          }),
        ],
      })
    );
  }

  const findingsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: findingsTableRows,
  });

  // Severity Matrix
  function severityCell(text, fill, fontColor = "000000") {
    return new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text, color: fontColor, size: 20 })],
          alignment: AlignmentType.CENTER,
        }),
      ],
      shading: { fill: fill.replace("#", "") },
    });
  }

  const severityMatrix = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          severityCell(`${criticalCount}\nCritical`, "#940000", "FFFFFF"),
          severityCell(`${highCount}\nHigh`, "#FF0000", "FFFFFF"),
          severityCell(`${mediumCount}\nMedium`, "#FFA500"),
        ],
      }),
      new TableRow({
        children: [
          severityCell(`${lowCount}\nLow`, "#FFFF00"),
          severityCell(`${infoCount}\nInformational`, "#ADD8E6"),
          severityCell(`${total}\nTotal`, "#C0C0C0"),
        ],
      }),
    ],
  });

  const children = [];

  // Cover Page
  children.push(
    titleParagraph("Penetration Test Report"),
    headerParagraph("Warba Bank"),
    subheaderParagraph("Cyber Security Division/Assessment Unit")
  );

  const projectInfoRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [normalParagraph("Project Name", { after: 100 })],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({
          children: [
            normalParagraph(
              projectName +
                (assessmentType === "Reassessment" ? " (Reassessment)" : "")
            ),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [normalParagraph("Version", { after: 100 })],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({ children: [normalParagraph(version)] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [normalParagraph("Date", { after: 100 })],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({ children: [normalParagraph(startDate)] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [normalParagraph("Assessor", { after: 100 })],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({ children: [normalParagraph(assessorName)] }),
      ],
    }),
  ];
  const projectInfoTable = new Table({
    width: { size: 50, type: WidthType.PERCENTAGE },
    rows: projectInfoRows,
  });

  children.push(projectInfoTable);
  children.push(pageBreakParagraph()); // After cover page

  // Executive Summary & Scope
  children.push(
    sectionHeaderParagraph("1. Executive Summary"),
    subSectionHeaderParagraph("1.1 Assessment Overview"),
    normalParagraph(
      `The assessment of ${projectName} commenced on ${startDate} and concluded on ${endDate}. This assessment was requested by Digital Factory Division to identify any final concerns before the standard is finalized and published.\n\n` +
        `The assessment engaged the services of Warba in order to:\n` +
        `• Evaluate whether the security controls introduced in ${projectName} were effective.\n` +
        `• Gauge whether the identified risks are acceptable.\n\n` +
        `These results are a point-in-time assessment. Changes may yield different results.`
    ),
    subSectionHeaderParagraph("1.2 Scope"),
    normalParagraph(`${scope}\nWhite Box Penetration Testing.`)
  );

  children.push(subSectionHeaderParagraph("Platform & URLs"));
  const platformRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [normalParagraph("Platform", { after: 100 })],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({ children: [normalParagraph(platform)] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [normalParagraph("IP Address/URL's", { after: 100 })],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({ children: [normalParagraph(urls)] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [normalParagraph("Credentials", { after: 100 })],
          shading: { fill: "CCCCCC" },
        }),
        new TableCell({ children: [normalParagraph(credentials)] }),
      ],
    }),
  ];
  const platformTableDocx = new Table({
    width: { size: 50, type: WidthType.PERCENTAGE },
    rows: platformRows,
  });
  children.push(platformTableDocx);
  children.push(pageBreakParagraph()); // After Platform & URLs section

  // High Level Summary
  children.push(
    sectionHeaderParagraph("2. High Level Summary"),
    normalParagraph(methodology)
  );
  children.push(pageBreakParagraph()); // After High Level Summary

  // Detailed Finding
  children.push(
    sectionHeaderParagraph("3. Detailed Finding:"),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "The overall information security risk rating was calculated as: ",
          size: 20,
        }),
        new TextRun({
          text: overallRiskRating,
          color: ratingColor,
          bold: true,
          size: 20,
        }),
        new TextRun({ text: ".", size: 20 }),
      ],
    }),
    normalParagraph(""), // spacer
    // Insert findingsTable
    new Paragraph({ children: [], spacing: { after: 100 } })
  );
  children.push(findingsTable);

  children.push(normalParagraph("")); // spacer
  children.push(severityMatrix);

  children.push(subSectionHeaderParagraph("3.1. VULNERABILITIES FOUND:"));

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    children.push(
      findingTitleParagraph(`${i + 1}. ${f.title}`),
      normalParagraph(`Category: ${f.category}`, { before: 100 }),
      normalParagraph(`Severity: ${f.severity}`, { before: 100 }),
      normalParagraph(`Description: ${f.description}`, { before: 100 }),
      normalParagraph(`Impact: ${f.impact}`, { before: 100 }),
      normalParagraph(`Mitigation: ${f.mitigation}`, {
        before: 100,
        after: 200,
      })
    );

    if (f.pocImages && f.pocImages.length > 0) {
      children.push(normalParagraph("PoC:", { before: 100 }));
      for (let img of f.pocImages) {
        const imgBuffer = await base64ToArrayBuffer(img.data);
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imgBuffer,
                transformation: { width: 300, height: 200 },
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    }
  }

  children.push(pageBreakParagraph()); // After detailed findings

  // Conclusion/Assessor Statement
  children.push(
    sectionHeaderParagraph("4. Assessor Statement"),
    new Paragraph({
      children: [
        new TextRun({ text: assessorName, bold: true, size: 20 }),
        new TextRun({
          text: " has completed a Security Assessment of ",
          size: 20,
        }),
        new TextRun({ text: projectName, bold: true, size: 20 }),
        new TextRun({
          text: " in accordance with: OWASP top 10, PCI-DSS, ISO 27001 and the result is Compliant.",
          size: 20,
        }),
      ],
      spacing: { before: 200, after: 200 },
    })
  );

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const day = new Date().getDate();
  const blob = await Packer.toBlob(doc);
  const fileName = `${projectName.replace(
    /\s+/g,
    " "
  )} - Penetration Test Report_${day}.docx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
