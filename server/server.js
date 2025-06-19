const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { nanoid } = require("nanoid");
const { dbHelpers, db } = require("./database");
const { migrateFromLocalStorage, exportToLocalStorage } = require("./migrate");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// REPORTS ENDPOINTS

// Get all reports (optimized for listing)
app.get("/api/reports", async (req, res) => {
  try {
    console.time("getAllReports");

    // Get reports with minimal data for performance
    const reports = await dbHelpers.getAllReportsLight();

    // Get findings counts for all reports in one query
    const reportIds = reports.map((r) => r.id);
    const findingsCounts = await dbHelpers.getFindingsCountByReports(reportIds);

    // Format response with minimal processing
    const formattedReports = reports.map((report) => {
      const counts = findingsCounts[report.id] || { total: 0, open: 0 };

      return {
        id: report.id,
        projectName: report.project_name,
        version: report.version,
        assessmentType: report.assessment_type,
        startDate: report.start_date,
        endDate: report.end_date,
        assessorName: report.assessor_name,
        platform: report.platform,
        projectStatus: report.project_status,
        requestedBy: report.requested_by,
        fixByDate: report.fix_by_date,
        parentAssessmentId: report.parent_assessment_id,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
        // Add findings count without loading full data
        findingsCount: counts.total,
        openFindingsCount: counts.open,
        // Minimal findings array for compatibility
        detailedFindings: [],
      };
    });

    console.timeEnd("getAllReports");
    res.json(formattedReports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Get all reports with full details (for export/migration)
app.get("/api/reports/full", async (req, res) => {
  try {
    console.time("getAllReportsFull");

    const reports = await dbHelpers.getAllReports();

    // Convert database format to frontend format
    const formattedReports = await Promise.all(
      reports.map(async (report) => {
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

        return {
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
        };
      })
    );

    console.timeEnd("getAllReportsFull");
    res.json(formattedReports);
  } catch (error) {
    console.error("Error fetching full reports:", error);
    res.status(500).json({ error: "Failed to fetch full reports" });
  }
});

// Get single report
app.get("/api/reports/:id", async (req, res) => {
  try {
    const report = await dbHelpers.getReport(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

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

    const formattedReport = {
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
    };

    res.json(formattedReport);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

// Create new report
app.post("/api/reports", async (req, res) => {
  try {
    const reportData = {
      id: nanoid(),
      ...req.body,
    };

    await dbHelpers.createReport(reportData);
    res.json({ id: reportData.id, message: "Report created successfully" });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
});

// Bulk create reports (for migration)
app.post("/api/reports/bulk", async (req, res) => {
  try {
    const { reports } = req.body;

    if (!Array.isArray(reports)) {
      return res.status(400).json({ error: "Expected an array of reports" });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const reportData of reports) {
      try {
        // Check for ID conflicts and generate new ID if needed
        let reportId = reportData.id || nanoid();
        try {
          const existingReport = await dbHelpers.getReport(reportId);
          if (existingReport) {
            reportId = nanoid(); // Generate new ID if conflict exists
            console.log(
              `ID conflict detected for ${reportData.projectName}, using new ID: ${reportId}`
            );
          }
        } catch (error) {
          // Report doesn't exist, which is fine
        }

        const reportWithId = {
          ...reportData,
          id: reportId,
        };

        await dbHelpers.createReport(reportWithId);

        // Create findings for this report
        if (reportData.detailedFindings) {
          for (const finding of reportData.detailedFindings) {
            const findingResult = await dbHelpers.createFinding(
              reportWithId.id,
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
                        image.name || `${nanoid()}.${mimeType.split("/")[1]}`,
                      originalName: image.name || "imported_image",
                      mimeType,
                      fileSize: buffer.length,
                      buffer,
                    });
                  } catch (imageError) {
                    console.error(
                      `Failed to save image: ${image.name}`,
                      imageError
                    );
                  }
                }
              }
            }
          }
        }

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          report: reportData.projectName || reportData.id,
          error: error.message,
        });
        console.error(
          `Failed to create report ${reportData.projectName}:`,
          error
        );
      }
    }

    res.json({
      message: "Bulk import completed",
      successCount,
      errorCount,
      errors: errors.slice(0, 10), // Limit error details
    });
  } catch (error) {
    console.error("Error in bulk create:", error);
    res.status(500).json({ error: "Failed to bulk create reports" });
  }
});

// Update report
app.put("/api/reports/:id", async (req, res) => {
  try {
    const { detailedFindings, ...reportData } = req.body;

    // Update report basic data
    await dbHelpers.updateReport(req.params.id, reportData);

    // Handle findings if provided
    if (detailedFindings) {
      // Get existing findings
      const existingFindings = await dbHelpers.getFindingsByReport(
        req.params.id
      );

      // Delete findings that are no longer in the array
      const newFindingIds = detailedFindings
        .filter((f) => f.id)
        .map((f) => f.id);
      for (const existing of existingFindings) {
        if (!newFindingIds.includes(existing.id)) {
          await dbHelpers.deleteFinding(existing.id);
        }
      }

      // Update or create findings
      for (const finding of detailedFindings) {
        if (finding.id) {
          // Update existing finding
          await dbHelpers.updateFinding(finding.id, finding);
        } else {
          // Create new finding
          const result = await dbHelpers.createFinding(req.params.id, finding);
          finding.id = result.id;
        }

        // Handle images for this finding
        if (finding.pocImages && finding.pocImages.length > 0) {
          // Get existing images
          const existingImages = await dbHelpers.getImagesByFinding(finding.id);

          // Delete images that are no longer in the array
          const newImageIds = finding.pocImages
            .filter((img) => img.id)
            .map((img) => img.id);
          for (const existing of existingImages) {
            if (!newImageIds.includes(existing.id)) {
              await dbHelpers.deleteImage(existing.id);
            }
          }

          // Save new images
          for (const image of finding.pocImages) {
            if (!image.id && image.data) {
              // New image - save to database
              const base64Data = image.data.split(",")[1];
              const buffer = Buffer.from(base64Data, "base64");
              const mimeType = image.data.split(";")[0].split(":")[1];

              await dbHelpers.saveImage(finding.id, {
                filename: `${nanoid()}.${mimeType.split("/")[1]}`,
                originalName: image.name,
                mimeType,
                fileSize: buffer.length,
                buffer,
              });
            }
          }
        }
      }
    }

    res.json({ message: "Report updated successfully" });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ error: "Failed to update report" });
  }
});

// Delete report
app.delete("/api/reports/:id", async (req, res) => {
  try {
    await dbHelpers.deleteReport(req.params.id);
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

// Create reassessment
app.post("/api/reports/:id/reassessment", async (req, res) => {
  try {
    const originalReport = await dbHelpers.getReport(req.params.id);
    if (!originalReport) {
      return res.status(404).json({ error: "Original report not found" });
    }

    // Calculate next version
    const currentVersion = parseFloat(originalReport.version) || 1.0;
    const nextVersion = (currentVersion + 1.0).toFixed(1);

    const reassessmentData = {
      id: nanoid(),
      ...req.body,
      version: nextVersion,
      assessmentType: "Reassessment",
      parentAssessmentId: req.params.id,
      parentAssessmentData: {
        projectName: originalReport.project_name,
        version: originalReport.version,
        startDate: originalReport.start_date,
        endDate: originalReport.end_date,
        detailedFindings: await dbHelpers.getFindingsByReport(
          originalReport.id
        ),
      },
    };

    await dbHelpers.createReport(reassessmentData);

    // Copy findings if provided
    if (req.body.detailedFindings) {
      for (const finding of req.body.detailedFindings) {
        await dbHelpers.createFinding(reassessmentData.id, finding);
      }
    }

    res.json({
      id: reassessmentData.id,
      message: "Reassessment created successfully",
    });
  } catch (error) {
    console.error("Error creating reassessment:", error);
    res.status(500).json({ error: "Failed to create reassessment" });
  }
});

// IMAGE ENDPOINTS

// Upload image
app.post("/api/images/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const { findingId } = req.body;
    if (!findingId) {
      return res.status(400).json({ error: "Finding ID is required" });
    }

    const imageData = {
      filename: `${nanoid()}.${req.file.mimetype.split("/")[1]}`,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      buffer: req.file.buffer,
    };

    const result = await dbHelpers.saveImage(findingId, imageData);

    res.json({
      id: result.id,
      message: "Image uploaded successfully",
      filename: imageData.filename,
      originalName: imageData.originalName,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Get image
app.get("/api/images/:id", async (req, res) => {
  try {
    const image = await dbHelpers.getImage(req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.set({
      "Content-Type": image.mime_type,
      "Content-Length": image.file_size,
      "Content-Disposition": `inline; filename="${image.original_name}"`,
    });

    res.send(image.image_data);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

// Delete image
app.delete("/api/images/:id", async (req, res) => {
  try {
    await dbHelpers.deleteImage(req.params.id);
    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// MIGRATION ENDPOINTS

// Import localStorage data to database
app.post("/api/migrate/import", async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: "No data provided" });
    }

    // The migrateFromLocalStorage function expects a JSON string
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    const result = await migrateFromLocalStorage(dataString);

    if (result.success) {
      res.json({
        message: "Migration completed successfully",
        migratedReports: result.migratedReports,
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error("Error in migration:", error);
    res.status(500).json({ error: "Failed to migrate data" });
  }
});

// Export database to localStorage format
app.get("/api/migrate/export", async (req, res) => {
  try {
    const result = await exportToLocalStorage();

    if (result.success) {
      // Read the exported file and send its contents
      const fs = require("fs");
      const exportData = fs.readFileSync(result.exportPath, "utf8");

      res.set({
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="assessment-maker-export-${
          new Date().toISOString().split("T")[0]
        }.json"`,
      });

      res.send(exportData);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error("Error in export:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

// Get database statistics
app.get("/api/stats", async (req, res) => {
  try {
    console.time("getStats");

    // Use light version for better performance
    const reports = await dbHelpers.getAllReportsLight();
    const reportIds = reports.map((r) => r.id);
    const findingsCounts = await dbHelpers.getFindingsCountByReports(reportIds);

    // Calculate totals efficiently
    let totalImages = 0;
    let totalImageSize = 0;
    let totalFindings = 0;

    // Get image stats from database directly
    const imageStats = await new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) as count, SUM(file_size) as total_size FROM images",
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    totalImages = imageStats.count || 0;
    totalImageSize = imageStats.total_size || 0;

    // Calculate total findings from counts
    Object.values(findingsCounts).forEach((count) => {
      totalFindings += count.total;
    });

    const initialReports = reports.filter(
      (r) => r.assessment_type === "Initial"
    ).length;
    const reassessments = reports.filter(
      (r) => r.assessment_type === "Reassessment"
    ).length;

    console.timeEnd("getStats");

    res.json({
      reports: {
        total: reports.length,
        initial: initialReports,
        reassessments: reassessments,
      },
      findings: {
        total: totalFindings,
      },
      images: {
        total: totalImages,
        totalSize: totalImageSize,
      },
      database: {
        path: require("path").join(__dirname, "assessment_maker.db"),
        size: require("fs").statSync(
          require("path").join(__dirname, "assessment_maker.db")
        ).size,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// FINDINGS LIBRARY ENDPOINTS

// Get findings library
app.get("/api/findings-library", async (req, res) => {
  try {
    // For now, return empty array - will implement later
    res.json([]);
  } catch (error) {
    console.error("Error fetching findings library:", error);
    res.status(500).json({ error: "Failed to fetch findings library" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Encryption status endpoint
app.get("/api/encryption/status", (req, res) => {
  try {
    const encryptionService = require("./encryption");

    // Test encryption/decryption
    const testResult = encryptionService.test();

    res.json({
      status: "enabled",
      algorithm: "AES-256-CBC",
      keyDerivation: "PBKDF2",
      saltSize: 256,
      ivSize: 128,
      iterations: 10000,
      testPassed: testResult,
      timestamp: new Date().toISOString(),
      encryptedFields: {
        reports: encryptionService.getSensitiveFields().reports,
        findings: encryptionService.getSensitiveFields().findings,
        images: encryptionService.getSensitiveFields().images,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File size too large. Maximum 10MB allowed." });
    }
  }

  console.error("Server error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Assessment Maker API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
