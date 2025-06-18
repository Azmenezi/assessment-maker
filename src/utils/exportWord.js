import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

async function base64ToArrayBuffer(base64) {
  const res = await fetch(base64);
  const blob = await res.blob();
  return new Uint8Array(await blob.arrayBuffer());
}

// Helper functions to create styled text runs and paragraphs to match PDF styles exactly
function titleParagraph(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 44, color: "000000" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  });
}

function headerParagraph(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32, color: "000000" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  });
}

function subheaderParagraph(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: "000000" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });
}

function sectionHeaderParagraph(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: "000000" })],
    spacing: { before: 200, after: 100 },
  });
}

function subSectionHeaderParagraph(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: "000000" })],
    spacing: { before: 200, after: 100 },
  });
}

function normalParagraph(text, options = {}) {
  const color = options.color || "000000";
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color })],
    spacing: { before: options.before || 0, after: options.after || 0 },
  });
}

function findingTitleParagraph(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: "000000" })],
    spacing: { before: 200, after: 100 },
  });
}

function pageBreakParagraph() {
  return new Paragraph({ text: "", pageBreakBefore: true });
}

// Helper function to create severity-colored table cells
function createSeverityCell(text, severity) {
  let fillColor = "FFFFFF";
  let fontColor = "000000";

  switch (severity) {
    case "Critical":
      fillColor = "940000";
      fontColor = "FFFFFF";
      break;
    case "High":
      fillColor = "FF0000";
      fontColor = "FFFFFF";
      break;
    case "Medium":
      fillColor = "FFA500";
      fontColor = "000000";
      break;
    case "Low":
      fillColor = "FFFF00";
      fontColor = "000000";
      break;
    case "Informational":
      fillColor = "ADD8E6";
      fontColor = "000000";
      break;
    default:
      fillColor = "FFFFFF";
      fontColor = "000000";
  }

  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20, color: fontColor })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { fill: fillColor, type: ShadingType.SOLID },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

export async function exportReportToWord(
  report,
  settings,
  { returnDoc = false } = {}
) {
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
    ticketNumber,
    buildVersions,
    requestedBy,
  } = report;

  const findings = Array.isArray(detailedFindings) ? detailedFindings : [];

  // Sort findings by severity
  const severityOrder = {
    Critical: 1,
    High: 2,
    Medium: 3,
    Low: 4,
    Informational: 5,
  };

  findings.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  const counts = {
    critical: findings.filter(
      (f) => f.severity === "Critical" && f.status === "OPEN"
    ).length,
    high: findings.filter((f) => f.severity === "High" && f.status === "OPEN")
      .length,
    medium: findings.filter(
      (f) => f.severity === "Medium" && f.status === "OPEN"
    ).length,
    low: findings.filter((f) => f.severity === "Low" && f.status === "OPEN")
      .length,
    informational: findings.filter(
      (f) => f.severity === "Informational" && f.status === "OPEN"
    ).length,
  };

  let overallRiskRating = "None";
  let ratingColor = "000000";
  if (counts.critical > 0) {
    overallRiskRating = "Critical";
    ratingColor = "940000";
  } else if (counts.high > 0) {
    overallRiskRating = "High";
    ratingColor = "FF0000";
  } else if (counts.medium > 0) {
    overallRiskRating = "Medium";
    ratingColor = "FFA500";
  } else if (counts.low > 0) {
    overallRiskRating = "Low";
    ratingColor = "FFFF00";
  } else if (counts.informational > 0) {
    overallRiskRating = "Informational";
    ratingColor = "ADD8E6";
  }

  const criticalCount = counts.critical;
  const highCount = counts.high;
  const mediumCount = counts.medium;
  const lowCount = counts.low;
  const infoCount = counts.informational;
  const total = criticalCount + highCount + mediumCount + lowCount + infoCount;

  // Pre-process all images to avoid async issues in document building
  const processedFindings = [];
  for (const finding of findings) {
    const processedFinding = { ...finding };
    const processedImages = [];

    if (finding.pocImages && finding.pocImages.length > 0) {
      for (const img of finding.pocImages) {
        if (img && img.data) {
          try {
            // Load image data for file-stored images
            let imageData = img.data;
            if (img.isFileStored && window.electronAPI) {
              const result = await window.electronAPI.getImage(img.imageId);
              if (result.success) {
                imageData = result.data;
              } else {
                console.warn(
                  `Failed to load image ${img.imageId}:`,
                  result.error
                );
                processedImages.push({ name: img.name, error: true });
                continue;
              }
            }

            const imageBuffer = await base64ToArrayBuffer(imageData);
            processedImages.push({
              name: img.name,
              buffer: imageBuffer,
              error: false,
            });
          } catch (error) {
            console.error("Error processing PoC image:", error);
            processedImages.push({ name: img.name, error: true });
          }
        }
      }
    }

    processedFinding.processedImages = processedImages;
    processedFindings.push(processedFinding);
  }

  // Project details table - matching PDF exactly
  const projectDetailsTableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Project Name", bold: true, size: 20 }),
              ],
            }),
          ],
          shading: { fill: "FFFFFF" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    projectName +
                    (assessmentType === "Reassessment"
                      ? " - Reassessment"
                      : ""),
                  size: 20,
                }),
              ],
            }),
          ],
          shading: { fill: "FFFFFF" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Version", bold: true, size: 20 }),
              ],
            }),
          ],
          shading: { fill: "FFFFFF" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: version, size: 20 })],
            }),
          ],
          shading: { fill: "FFFFFF" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Date", bold: true, size: 20 })],
            }),
          ],
          shading: { fill: "FFFFFF" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: endDate || startDate, size: 20 })],
            }),
          ],
          shading: { fill: "FFFFFF" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Assessor", bold: true, size: 20 }),
              ],
            }),
          ],
          shading: { fill: "FFFFFF" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: assessorName, size: 20 })],
            }),
          ],
          shading: { fill: "FFFFFF" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
      ],
    }),
  ];

  // Add optional fields if they exist
  if (ticketNumber) {
    projectDetailsTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Ticket Number", bold: true, size: 20 }),
                ],
              }),
            ],
            shading: { fill: "FFFFFF" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: ticketNumber, size: 20 })],
              }),
            ],
            shading: { fill: "FFFFFF" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      })
    );
  }

  if (buildVersions) {
    projectDetailsTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Build Versions", bold: true, size: 20 }),
                ],
              }),
            ],
            shading: { fill: "FFFFFF" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: buildVersions, size: 20 })],
              }),
            ],
            shading: { fill: "FFFFFF" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      })
    );
  }

  const projectDetailsTable = new Table({
    rows: projectDetailsTableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  // Findings Table - with proper severity colors
  const findingsTableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "No", bold: true, size: 20 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { fill: "CCCCCC" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Vulnerability", bold: true, size: 20 }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { fill: "CCCCCC" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Severity", bold: true, size: 20 }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { fill: "CCCCCC" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Status", bold: true, size: 20 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { fill: "CCCCCC" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        }),
      ],
    }),
  ];

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i];
    findingsTableRows.push(
      new TableRow({
        children: [
          createSeverityCell(String(i + 1), f.severity),
          createSeverityCell(f.title, f.severity),
          createSeverityCell(f.severity, f.severity),
          createSeverityCell(f.status || "OPEN", f.severity),
        ],
      })
    );
  }

  const findingsTable = new Table({
    rows: findingsTableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  // Severity matrix table - matching PDF colors exactly
  const severityMatrixTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${criticalCount}\nCritical`,
                    size: 20,
                    color: "FFFFFF",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: "940000", type: ShadingType.SOLID },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${highCount}\nHigh`,
                    size: 20,
                    color: "FFFFFF",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: "FF0000", type: ShadingType.SOLID },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${mediumCount}\nMedium`,
                    size: 20,
                    color: "000000",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: "FFA500", type: ShadingType.SOLID },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${lowCount}\nLow`,
                    size: 20,
                    color: "000000",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: "FFFF00", type: ShadingType.SOLID },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${infoCount}\nInformational`,
                    size: 20,
                    color: "000000",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: "ADD8E6", type: ShadingType.SOLID },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${total}\nTotal`,
                    size: 20,
                    color: "000000",
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: "FFFFFF", type: ShadingType.SOLID },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  // Platform table
  const platformTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Platform", bold: true, size: 20 }),
                ],
              }),
            ],
            shading: { fill: "FFFFFF" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: platform || "", size: 20 })],
              }),
            ],
            shading: { fill: "FFFFFF" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "URLs/Endpoints", bold: true, size: 20 }),
                ],
              }),
            ],
            shading: { fill: "FFFFFF" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: urls || "", size: 20 })],
              }),
            ],
            shading: { fill: "FFFFFF" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Credentials", bold: true, size: 20 }),
                ],
              }),
            ],
            shading: { fill: "FFFFFF" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: credentials || "", size: 20 })],
              }),
            ],
            shading: { fill: "FFFFFF" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  // Build document content
  const children = [];

  // Title page - matching PDF layout
  if (settings.defaultLogo && settings.defaultLogo.startsWith("data:image/")) {
    try {
      const logoBuffer = await base64ToArrayBuffer(settings.defaultLogo);
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: logoBuffer,
              transformation: { width: 200, height: 100 },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 1000, after: 400 },
        })
      );
    } catch (error) {
      console.error("Error adding logo:", error);
      children.push(titleParagraph("Penetration Test Report"));
    }
  } else {
    children.push(titleParagraph("Penetration Test Report"));
  }

  children.push(titleParagraph("Penetration Test Report"));
  children.push(headerParagraph("Warba Bank"));
  children.push(subheaderParagraph("Cyber Security Division/Assessment Unit"));
  children.push(new Paragraph({ children: [], spacing: { after: 400 } }));
  children.push(projectDetailsTable);
  children.push(pageBreakParagraph());

  // Executive Summary & Scope
  children.push(sectionHeaderParagraph("1. Executive Summary"));
  children.push(subSectionHeaderParagraph("1.1 Assessment Overview"));
  children.push(
    normalParagraph(
      `The assessment of ${projectName} commenced on ${startDate} and concluded on ${endDate}. This assessment was requested by ${requestedBy} in order to identify any final concerns prior to the standard being finalized and published.

The assessment engaged the services of Warba in order to:
• Evaluate whether the security controls introduced in ${projectName} were effective when implemented.
• Gauge whether the risk identified within the protocol was at a level acceptable and that such risk would not have a significant impact on the delivery of the service, expose clients to harm or loss or other such consequences.

The results provided are the output of the security assessment performed and should be used as input into a larger risk management process. These results are a point in time assessment of the system and environment as they were presented for testing. Any changes could yield a different set of results.`
    )
  );

  children.push(subSectionHeaderParagraph("1.2 Scope"));
  children.push(normalParagraph(scope || ""));

  children.push(subSectionHeaderParagraph("Platform & URLs"));
  children.push(platformTable);
  children.push(new Paragraph({ children: [], spacing: { after: 400 } }));

  // High Level Summary
  children.push(sectionHeaderParagraph("2. High Level Summary"));
  children.push(
    normalParagraph(
      methodology ? methodology.replace(/{PROJECT_NAME}/g, projectName) : ""
    )
  );

  children.push(pageBreakParagraph());

  // Detailed Findings Section
  children.push(sectionHeaderParagraph("3. Detailed Finding:"));
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "The overall information security risk rating was calculated as: ",
          size: 20,
        }),
        new TextRun({
          text: overallRiskRating,
          size: 20,
          color: ratingColor,
          bold: true,
        }),
        new TextRun({ text: ".", size: 20 }),
      ],
      spacing: { before: 100, after: 200 },
    })
  );

  children.push(findingsTable);
  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  children.push(severityMatrixTable);

  // Individual findings details - now using pre-processed images
  if (processedFindings.length > 0) {
    children.push(pageBreakParagraph());
    processedFindings.forEach((f, index) => {
      children.push(findingTitleParagraph(`${index + 1}. ${f.title}`));
      children.push(subSectionHeaderParagraph("Category"));
      children.push(normalParagraph(f.category || ""));
      children.push(subSectionHeaderParagraph("Severity"));
      children.push(normalParagraph(f.severity || ""));
      children.push(subSectionHeaderParagraph("Description"));
      children.push(normalParagraph(f.description || ""));
      children.push(subSectionHeaderParagraph("Impact"));
      children.push(normalParagraph(f.impact || ""));
      children.push(subSectionHeaderParagraph("Mitigation"));
      children.push(normalParagraph(f.mitigation || ""));

      // Add affected endpoints if they exist
      if (f.affectedEndpoints && f.affectedEndpoints.length > 0) {
        children.push(subSectionHeaderParagraph("Affected Endpoints"));
        children.push(normalParagraph(f.affectedEndpoints.join(", ")));
      }

      // Add PoC images if they exist - now using pre-processed images
      if (f.processedImages && f.processedImages.length > 0) {
        children.push(subSectionHeaderParagraph("Proof of Concept"));
        f.processedImages.forEach((img) => {
          if (img.error) {
            children.push(
              normalParagraph(`[Image: ${img.name}] - Failed to load`)
            );
          } else {
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: img.buffer,
                    transformation: { width: 500, height: 300 },
                  }),
                ],
                spacing: { before: 100, after: 100 },
              })
            );
          }
        });
      }

      if (index < processedFindings.length - 1) {
        children.push(new Paragraph({ children: [], spacing: { after: 400 } }));
      }
    });
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  if (returnDoc) {
    return doc;
  }

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, "_")}_${
    assessmentType === "Initial" ? "assessment" : "reassessment"
  }.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
