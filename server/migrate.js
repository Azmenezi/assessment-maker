const { dbHelpers } = require("./database");
const fs = require("fs");
const path = require("path");
const { nanoid } = require("nanoid");

// Migration script to import data from localStorage backup
async function migrateFromLocalStorage(localStorageData) {
  console.log("Starting migration from localStorage...");

  try {
    const parsedData = JSON.parse(localStorageData);

    // Handle both formats: direct array or object with reports property
    let reports;
    if (Array.isArray(parsedData)) {
      reports = parsedData;
    } else if (parsedData.reports && Array.isArray(parsedData.reports)) {
      reports = parsedData.reports;
    } else {
      throw new Error(
        "Invalid data format. Expected array of reports or object with reports property."
      );
    }

    console.log(`Found ${reports.length} reports to migrate`);

    for (const report of reports) {
      console.log(
        `Migrating report: ${report.projectName} (v${report.version})`
      );

      // Check if report with this ID already exists
      let reportId = report.id;
      try {
        const existingReport = await dbHelpers.getReport(reportId);
        if (existingReport) {
          // Generate new ID if conflict exists
          reportId = nanoid();
          console.log(`  - ID conflict detected, using new ID: ${reportId}`);
        }
      } catch (error) {
        // Report doesn't exist, which is fine
      }

      // Create report in database with potentially new ID
      const reportData = { ...report, id: reportId };
      await dbHelpers.createReport(reportData);

      // Create findings for this report
      if (report.detailedFindings) {
        for (const finding of report.detailedFindings) {
          const findingResult = await dbHelpers.createFinding(
            reportId, // Use the new report ID
            finding
          );

          // Handle images if they exist
          if (finding.pocImages && finding.pocImages.length > 0) {
            for (const image of finding.pocImages) {
              if (image.data) {
                try {
                  // Convert base64 to buffer
                  const base64Data = image.data.split(",")[1];
                  const buffer = Buffer.from(base64Data, "base64");
                  const mimeType = image.data.split(";")[0].split(":")[1];

                  await dbHelpers.saveImage(findingResult.id, {
                    filename:
                      image.name ||
                      `image_${Date.now()}.${mimeType.split("/")[1]}`,
                    originalName: image.name || "imported_image",
                    mimeType,
                    fileSize: buffer.length,
                    buffer,
                  });

                  console.log(`  - Migrated image: ${image.name}`);
                } catch (imageError) {
                  console.error(
                    `  - Failed to migrate image: ${image.name}`,
                    imageError.message
                  );
                }
              }
            }
          }
        }
      }

      console.log(
        `  ✓ Migrated report with ${
          report.detailedFindings?.length || 0
        } findings`
      );
    }

    console.log("Migration completed successfully!");
    return { success: true, migratedReports: reports.length };
  } catch (error) {
    console.error("Migration failed:", error);
    return { success: false, error: error.message };
  }
}

// Function to export current database to localStorage format
async function exportToLocalStorage() {
  console.log("Exporting database to localStorage format...");

  try {
    // Use the full getAllReports for export to get all data
    const reports = await dbHelpers.getAllReports();
    const exportData = [];

    for (const report of reports) {
      const findings = await dbHelpers.getFindingsByReport(report.id);

      // Get images for each finding
      const findingsWithImages = await Promise.all(
        findings.map(async (finding) => {
          const images = await dbHelpers.getImagesByFinding(finding.id);
          return {
            ...finding,
            pocImages: images.map((img) => ({
              id: img.id,
              name: img.original_name,
              data: `data:${img.mime_type};base64,${img.image_data.toString(
                "base64"
              )}`,
            })),
          };
        })
      );

      // Convert to frontend format
      exportData.push({
        id: report.id,
        projectName: report.project_name,
        version: report.version,
        assessmentType: report.assessment_type,
        startDate: report.start_date,
        endDate: report.end_date,
        assessorName: report.assessor_name,
        platform: report.platform,
        urls: report.urls,
        credentials: report.credentials,
        ticketNumber: report.ticket_number,
        buildVersions: report.build_versions,
        projectStatus: report.project_status,
        requestedBy: report.requested_by,
        fixByDate: report.fix_by_date,
        executiveSummary: report.executive_summary,
        scope: report.scope,
        methodology: report.methodology,
        conclusion: report.conclusion,
        logo: report.logo,
        parentAssessmentId: report.parent_assessment_id,
        parentAssessmentData: report.parent_assessment_data,
        detailedFindings: findingsWithImages,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      });
    }

    const exportString = JSON.stringify(exportData, null, 2);
    const exportPath = path.join(__dirname, "export_localStorage.json");
    fs.writeFileSync(exportPath, exportString);

    console.log(`Exported ${exportData.length} reports to: ${exportPath}`);
    return { success: true, exportPath, exportedReports: exportData.length };
  } catch (error) {
    console.error("Export failed:", error);
    return { success: false, error: error.message };
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const filePath = process.argv[3];

  if (command === "import" && filePath) {
    // Import from localStorage backup file
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      migrateFromLocalStorage(data).then((result) => {
        if (result.success) {
          console.log(
            `Successfully migrated ${result.migratedReports} reports!`
          );
        } else {
          console.error("Migration failed:", result.error);
        }
        process.exit(result.success ? 0 : 1);
      });
    } else {
      console.error("File not found:", filePath);
      process.exit(1);
    }
  } else if (command === "export") {
    // Export database to localStorage format
    exportToLocalStorage().then((result) => {
      if (result.success) {
        console.log(
          `Successfully exported ${result.exportedReports} reports to ${result.exportPath}`
        );
      } else {
        console.error("Export failed:", result.error);
      }
      process.exit(result.success ? 0 : 1);
    });
  } else {
    console.log("Usage:");
    console.log(
      "  node migrate.js import <localStorage_backup.json>  # Import from localStorage backup"
    );
    console.log(
      "  node migrate.js export                             # Export database to JSON"
    );
    console.log("");
    console.log("Examples:");
    console.log("  node migrate.js import backup.json");
    console.log("  node migrate.js export");
    process.exit(1);
  }
}

module.exports = { migrateFromLocalStorage, exportToLocalStorage };
