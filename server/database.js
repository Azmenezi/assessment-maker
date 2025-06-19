const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create database connection
const dbPath = path.join(__dirname, "assessment_maker.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
    initDatabase();
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
        executiveSummary,
        scope,
        methodology,
        conclusion,
        logo,
        parentAssessmentId,
        parentAssessmentData,
      } = reportData;

      const sql = `
        INSERT INTO reports (
          id, project_name, version, assessment_type, start_date, end_date,
          assessor_name, platform, urls, credentials, ticket_number,
          build_versions, project_status, requested_by, executive_summary,
          scope, methodology, conclusion, logo, parent_assessment_id,
          parent_assessment_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [
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
          executiveSummary,
          scope,
          methodology,
          conclusion,
          logo,
          parentAssessmentId,
          JSON.stringify(parentAssessmentData),
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

      // Build dynamic update query
      Object.keys(reportData).forEach((key) => {
        if (key === "parentAssessmentData") {
          fields.push("parent_assessment_data = ?");
          values.push(JSON.stringify(reportData[key]));
        } else {
          const dbField = key.replace(/([A-Z])/g, "_$1").toLowerCase();
          fields.push(`${dbField} = ?`);
          values.push(reportData[key]);
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
          if (row && row.parent_assessment_data) {
            try {
              row.parent_assessment_data = JSON.parse(
                row.parent_assessment_data
              );
            } catch (e) {
              row.parent_assessment_data = null;
            }
          }
          resolve(row);
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
            rows.forEach((row) => {
              if (row.parent_assessment_data) {
                try {
                  row.parent_assessment_data = JSON.parse(
                    row.parent_assessment_data
                  );
                } catch (e) {
                  row.parent_assessment_data = null;
                }
              }
            });
            resolve(rows);
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

      const sql = `
        INSERT INTO findings (
          report_id, title, category, severity, description, impact, mitigation, status, affected_endpoints
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [
          reportId,
          title,
          category,
          severity,
          description,
          impact,
          mitigation,
          status,
          JSON.stringify(affectedEndpoints || []),
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

      const sql = `
        UPDATE findings SET 
          title = ?, category = ?, severity = ?, description = ?, impact = ?, 
          mitigation = ?, status = ?, affected_endpoints = ?
        WHERE id = ?
      `;

      db.run(
        sql,
        [
          title,
          category,
          severity,
          description,
          impact,
          mitigation,
          status,
          JSON.stringify(affectedEndpoints || []),
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
            rows.forEach((row) => {
              if (row.affected_endpoints) {
                try {
                  row.affected_endpoints = JSON.parse(row.affected_endpoints);
                } catch (e) {
                  row.affected_endpoints = [];
                }
              }
            });
            resolve(rows);
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

      const sql = `
        INSERT INTO images (finding_id, filename, original_name, mime_type, file_size, image_data)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [findingId, filename, originalName, mimeType, fileSize, buffer],
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
          else resolve(rows);
        }
      );
    });
  },

  async getImage(id) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM images WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
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

module.exports = { db, dbHelpers };
