const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const encryptionService = require("./encryption");

// Create database connection
const dbPath = path.join(__dirname, "assessment_maker.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
    initDatabase();
    // Test encryption system
    encryptionService.test();
  }
});

// Initialize database tables
function initDatabase() {
  // Reports table
  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      version TEXT,
      assessment_type TEXT,
      start_date TEXT,
      end_date TEXT,
      assessor_name TEXT,
      platform TEXT,
      urls TEXT,
      credentials TEXT,
      ticket_number TEXT,
      build_versions TEXT,
      project_status TEXT,
      requested_by TEXT,
      fix_by_date TEXT,
      executive_summary TEXT,
      scope TEXT,
      methodology TEXT,
      conclusion TEXT,
      logo TEXT,
      parent_assessment_id TEXT,
      parent_assessment_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add the fix_by_date column if it doesn't exist (for existing databases)
  db.run(
    `
    ALTER TABLE reports ADD COLUMN fix_by_date TEXT
  `,
    (err) => {
      // Ignore error if column already exists
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Error adding fix_by_date column:", err);
      }
    }
  );

  // Findings table
  db.run(`
    CREATE TABLE IF NOT EXISTS findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT,
      severity TEXT,
      description TEXT,
      impact TEXT,
      mitigation TEXT,
      status TEXT DEFAULT 'OPEN',
      affected_endpoints TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE
    )
  `);

  // Images table
  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      finding_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT,
      mime_type TEXT,
      file_size INTEGER,
      image_data BLOB,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (finding_id) REFERENCES findings (id) ON DELETE CASCADE
    )
  `);

  // Findings library table
  db.run(`
    CREATE TABLE IF NOT EXISTS findings_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT,
      severity TEXT,
      description TEXT,
      impact TEXT,
      mitigation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Database tables initialized");
}

// Helper functions
const dbHelpers = {
  // Reports
  async createReport(reportData) {
    return new Promise((resolve, reject) => {
      const {
        id,
        projectName,
        version,
        assessmentType,
        startDate,
        endDate,
        assessorName,
        platform,
        urls,
        credentials,
        ticketNumber,
        buildVersions,
        projectStatus,
        requestedBy,
        fixByDate,
        executiveSummary,
        scope,
        methodology,
        conclusion,
        logo,
        parentAssessmentId,
        parentAssessmentData,
      } = reportData;

      // Encrypt sensitive fields
      const sensitiveFields = encryptionService.getSensitiveFields().reports;
      const encryptedData = {
        id,
        projectName: encryptionService.encrypt(projectName),
        version,
        assessmentType,
        startDate,
        endDate,
        assessorName: encryptionService.encrypt(assessorName),
        platform: encryptionService.encrypt(platform),
        urls: encryptionService.encrypt(urls),
        credentials: encryptionService.encrypt(credentials),
        ticketNumber: encryptionService.encrypt(ticketNumber),
        buildVersions: encryptionService.encrypt(buildVersions),
        projectStatus,
        requestedBy: encryptionService.encrypt(requestedBy),
        fixByDate,
        executiveSummary: encryptionService.encrypt(executiveSummary),
        scope: encryptionService.encrypt(scope),
        methodology: encryptionService.encrypt(methodology),
        conclusion: encryptionService.encrypt(conclusion),
        logo,
        parentAssessmentId,
        parentAssessmentData: encryptionService.encrypt(
          JSON.stringify(parentAssessmentData)
        ),
      };

      const sql = `
        INSERT INTO reports (
          id, project_name, version, assessment_type, start_date, end_date,
          assessor_name, platform, urls, credentials, ticket_number,
          build_versions, project_status, requested_by, fix_by_date,
          executive_summary, scope, methodology, conclusion, logo, 
          parent_assessment_id, parent_assessment_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [
          encryptedData.id,
          encryptedData.projectName,
          encryptedData.version,
          encryptedData.assessmentType,
          encryptedData.startDate,
          encryptedData.endDate,
          encryptedData.assessorName,
          encryptedData.platform,
          encryptedData.urls,
          encryptedData.credentials,
          encryptedData.ticketNumber,
          encryptedData.buildVersions,
          encryptedData.projectStatus,
          encryptedData.requestedBy,
          encryptedData.fixByDate,
          encryptedData.executiveSummary,
          encryptedData.scope,
          encryptedData.methodology,
          encryptedData.conclusion,
          encryptedData.logo,
          encryptedData.parentAssessmentId,
          encryptedData.parentAssessmentData,
        ],
        function (err) {
          if (err) reject(err);
          else resolve({ id, changes: this.changes });
        }
      );
    });
  },

  async updateReport(id, reportData) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];

      // Build dynamic update query with encryption
      Object.keys(reportData).forEach((key) => {
        const dbField = key.replace(/([A-Z])/g, "_$1").toLowerCase();

        if (key === "parentAssessmentData") {
          fields.push("parent_assessment_data = ?");
          values.push(
            encryptionService.encrypt(JSON.stringify(reportData[key]))
          );
        } else {
          // Check if this field should be encrypted
          const sensitiveFields =
            encryptionService.getSensitiveFields().reports;
          const shouldEncrypt = sensitiveFields.includes(dbField);

          fields.push(`${dbField} = ?`);
          values.push(
            shouldEncrypt
              ? encryptionService.encrypt(reportData[key])
              : reportData[key]
          );
        }
      });

      fields.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);

      const sql = `UPDATE reports SET ${fields.join(", ")} WHERE id = ?`;

      db.run(sql, values, function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  async getReport(id) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM reports WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else {
          if (row) {
            // Decrypt sensitive fields
            const decryptedRow = {
              ...row,
              project_name: encryptionService.decrypt(row.project_name),
              assessor_name: encryptionService.decrypt(row.assessor_name),
              platform: encryptionService.decrypt(row.platform),
              urls: encryptionService.decrypt(row.urls),
              credentials: encryptionService.decrypt(row.credentials),
              ticket_number: encryptionService.decrypt(row.ticket_number),
              build_versions: encryptionService.decrypt(row.build_versions),
              requested_by: encryptionService.decrypt(row.requested_by),
              executive_summary: encryptionService.decrypt(
                row.executive_summary
              ),
              scope: encryptionService.decrypt(row.scope),
              methodology: encryptionService.decrypt(row.methodology),
              conclusion: encryptionService.decrypt(row.conclusion),
            };

            // Handle parent assessment data
            if (decryptedRow.parent_assessment_data) {
              try {
                const decryptedParentData = encryptionService.decrypt(
                  decryptedRow.parent_assessment_data
                );
                decryptedRow.parent_assessment_data =
                  JSON.parse(decryptedParentData);
              } catch (e) {
                decryptedRow.parent_assessment_data = null;
              }
            }

            resolve(decryptedRow);
          } else {
            resolve(row);
          }
        }
      });
    });
  },

  async getAllReports() {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM reports ORDER BY updated_at DESC",
        [],
        (err, rows) => {
          if (err) reject(err);
          else {
            const decryptedRows = rows.map((row) => {
              // Decrypt sensitive fields
              const decryptedRow = {
                ...row,
                project_name: encryptionService.decrypt(row.project_name),
                assessor_name: encryptionService.decrypt(row.assessor_name),
                platform: encryptionService.decrypt(row.platform),
                urls: encryptionService.decrypt(row.urls),
                credentials: encryptionService.decrypt(row.credentials),
                ticket_number: encryptionService.decrypt(row.ticket_number),
                build_versions: encryptionService.decrypt(row.build_versions),
                requested_by: encryptionService.decrypt(row.requested_by),
                executive_summary: encryptionService.decrypt(
                  row.executive_summary
                ),
                scope: encryptionService.decrypt(row.scope),
                methodology: encryptionService.decrypt(row.methodology),
                conclusion: encryptionService.decrypt(row.conclusion),
              };

              // Handle parent assessment data
              if (decryptedRow.parent_assessment_data) {
                try {
                  const decryptedParentData = encryptionService.decrypt(
                    decryptedRow.parent_assessment_data
                  );
                  decryptedRow.parent_assessment_data =
                    JSON.parse(decryptedParentData);
                } catch (e) {
                  decryptedRow.parent_assessment_data = null;
                }
              }

              return decryptedRow;
            });

            resolve(decryptedRows);
          }
        }
      );
    });
  },

  async deleteReport(id) {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM reports WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Optimized function to get reports list without detailed findings/images (for performance)
  async getAllReportsLight() {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT id, project_name, version, assessment_type, start_date, end_date, assessor_name, platform, project_status, requested_by, fix_by_date, parent_assessment_id, created_at, updated_at FROM reports ORDER BY updated_at DESC",
        [],
        (err, rows) => {
          if (err) reject(err);
          else {
            const decryptedRows = rows.map((row) => {
              // Decrypt only essential fields for listing
              const decryptedRow = {
                ...row,
                project_name: encryptionService.decrypt(row.project_name),
                assessor_name: encryptionService.decrypt(row.assessor_name),
                platform: encryptionService.decrypt(row.platform),
                requested_by: encryptionService.decrypt(row.requested_by),
              };

              return decryptedRow;
            });

            resolve(decryptedRows);
          }
        }
      );
    });
  },

  // Get findings count for multiple reports efficiently
  async getFindingsCountByReports(reportIds) {
    return new Promise((resolve, reject) => {
      if (reportIds.length === 0) {
        resolve({});
        return;
      }

      const placeholders = reportIds.map(() => "?").join(",");
      const sql = `
        SELECT report_id, 
               COUNT(*) as total_count,
               SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open_count
        FROM findings 
        WHERE report_id IN (${placeholders})
        GROUP BY report_id
      `;

      db.all(sql, reportIds, (err, rows) => {
        if (err) reject(err);
        else {
          const counts = {};
          rows.forEach((row) => {
            counts[row.report_id] = {
              total: row.total_count,
              open: row.open_count,
            };
          });
          resolve(counts);
        }
      });
    });
  },

  // Findings
  async createFinding(reportId, findingData) {
    return new Promise((resolve, reject) => {
      const {
        title,
        category,
        severity,
        description,
        impact,
        mitigation,
        status,
        affectedEndpoints,
      } = findingData;

      // Encrypt sensitive fields
      const encryptedData = {
        title: encryptionService.encrypt(title),
        category,
        severity,
        description: encryptionService.encrypt(description),
        impact: encryptionService.encrypt(impact),
        mitigation: encryptionService.encrypt(mitigation),
        status,
        affectedEndpoints: encryptionService.encrypt(
          JSON.stringify(affectedEndpoints || [])
        ),
      };

      const sql = `
        INSERT INTO findings (
          report_id, title, category, severity, description, impact, mitigation, status, affected_endpoints
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [
          reportId,
          encryptedData.title,
          encryptedData.category,
          encryptedData.severity,
          encryptedData.description,
          encryptedData.impact,
          encryptedData.mitigation,
          encryptedData.status,
          encryptedData.affectedEndpoints,
        ],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        }
      );
    });
  },

  async updateFinding(id, findingData) {
    return new Promise((resolve, reject) => {
      const {
        title,
        category,
        severity,
        description,
        impact,
        mitigation,
        status,
        affectedEndpoints,
      } = findingData;

      // Encrypt sensitive fields
      const encryptedData = {
        title: encryptionService.encrypt(title),
        category,
        severity,
        description: encryptionService.encrypt(description),
        impact: encryptionService.encrypt(impact),
        mitigation: encryptionService.encrypt(mitigation),
        status,
        affectedEndpoints: encryptionService.encrypt(
          JSON.stringify(affectedEndpoints || [])
        ),
      };

      const sql = `
        UPDATE findings SET 
          title = ?, category = ?, severity = ?, description = ?, impact = ?, 
          mitigation = ?, status = ?, affected_endpoints = ?
        WHERE id = ?
      `;

      db.run(
        sql,
        [
          encryptedData.title,
          encryptedData.category,
          encryptedData.severity,
          encryptedData.description,
          encryptedData.impact,
          encryptedData.mitigation,
          encryptedData.status,
          encryptedData.affectedEndpoints,
          id,
        ],
        function (err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  async getFindingsByReport(reportId) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM findings WHERE report_id = ?",
        [reportId],
        (err, rows) => {
          if (err) reject(err);
          else {
            const decryptedRows = rows.map((row) => {
              // Decrypt sensitive fields
              const decryptedRow = {
                ...row,
                title: encryptionService.decrypt(row.title),
                description: encryptionService.decrypt(row.description),
                impact: encryptionService.decrypt(row.impact),
                mitigation: encryptionService.decrypt(row.mitigation),
              };

              // Handle affected endpoints
              if (decryptedRow.affected_endpoints) {
                try {
                  const decryptedEndpoints = encryptionService.decrypt(
                    decryptedRow.affected_endpoints
                  );
                  decryptedRow.affected_endpoints =
                    JSON.parse(decryptedEndpoints);
                } catch (e) {
                  decryptedRow.affected_endpoints = [];
                }
              }

              return decryptedRow;
            });

            resolve(decryptedRows);
          }
        }
      );
    });
  },

  async deleteFinding(id) {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM findings WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Images
  async saveImage(findingId, imageData) {
    return new Promise((resolve, reject) => {
      const { filename, originalName, mimeType, fileSize, buffer } = imageData;

      // Encrypt image data and sensitive metadata
      const encryptedBuffer = encryptionService.encryptImage(buffer);
      const encryptedFilename = encryptionService.encrypt(filename);
      const encryptedOriginalName = encryptionService.encrypt(originalName);

      const sql = `
        INSERT INTO images (finding_id, filename, original_name, mime_type, file_size, image_data)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [
          findingId,
          encryptedFilename,
          encryptedOriginalName,
          mimeType,
          fileSize,
          encryptedBuffer,
        ],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        }
      );
    });
  },

  async getImagesByFinding(findingId) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM images WHERE finding_id = ?",
        [findingId],
        (err, rows) => {
          if (err) reject(err);
          else {
            const decryptedRows = rows.map((row) => ({
              ...row,
              filename: encryptionService.decrypt(row.filename),
              original_name: encryptionService.decrypt(row.original_name),
              image_data: encryptionService.decryptImage(row.image_data),
            }));

            resolve(decryptedRows);
          }
        }
      );
    });
  },

  async getImage(id) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM images WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else {
          if (row) {
            // Decrypt image data and metadata
            const decryptedRow = {
              ...row,
              filename: encryptionService.decrypt(row.filename),
              original_name: encryptionService.decrypt(row.original_name),
              image_data: encryptionService.decryptImage(row.image_data),
            };
            resolve(decryptedRow);
          } else {
            resolve(row);
          }
        }
      });
    });
  },

  async deleteImage(id) {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM images WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },
};

module.exports = { dbHelpers, db };
